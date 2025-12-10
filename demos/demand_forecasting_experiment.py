"""
🔬 Demand Forecasting Experiment Framework
==========================================
This script runs a comprehensive ML experiment to find the best model
for predicting real market demand (sales + backorder).

Features:
- Multiple models (LightGBM, XGBoost, Random Forest, Ridge)
- Multiple split strategies (Simple, Walk-Forward)
- Hyperparameter tuning
- Comprehensive metrics comparison
- Final recommendation
- Visual comparison: Sales vs Real Demand vs Predicted

Author: AI Assistant
Date: 2024
"""

import pandas as pd
import numpy as np
import warnings
from datetime import datetime
from itertools import product
from typing import Dict, List, Tuple, Any
import json

# ML Libraries
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import LabelEncoder
import lightgbm as lgb
import xgboost as xgb

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

# Plot style
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['figure.figsize'] = (14, 8)
plt.rcParams['font.size'] = 12

# ============================================================
# 📏 METRICS FUNCTIONS
# ============================================================

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate all evaluation metrics."""
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    
    # Clip predictions to be non-negative
    y_pred = np.clip(y_pred, 0, None)
    
    # Basic metrics
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred)**2))
    bias = np.mean(y_pred - y_true)
    
    # MAPE (only where real > 0)
    mask = y_true > 0
    if mask.sum() > 0:
        mape = np.mean(np.abs(y_true[mask] - y_pred[mask]) / y_true[mask]) * 100
    else:
        mape = np.nan
    
    # WMAPE (weighted by volume)
    total_actual = np.sum(np.abs(y_true))
    if total_actual > 0:
        wmape = np.sum(np.abs(y_true - y_pred)) / total_actual * 100
    else:
        wmape = np.nan
    
    # Accuracy within 20% (business metric)
    if mask.sum() > 0:
        within_20 = np.mean(np.abs(y_true[mask] - y_pred[mask]) / y_true[mask] <= 0.20) * 100
    else:
        within_20 = np.nan
    
    return {
        'MAE': round(mae, 2),
        'RMSE': round(rmse, 2),
        'MAPE': round(mape, 2) if not np.isnan(mape) else None,
        'WMAPE': round(wmape, 2) if not np.isnan(wmape) else None,
        'Bias': round(bias, 2),
        'Accuracy_20pct': round(within_20, 2) if not np.isnan(within_20) else None
    }


# ============================================================
# 🔧 FEATURE ENGINEERING
# ============================================================

def create_features(df: pd.DataFrame, target_col: str = 'real_demand_qty') -> pd.DataFrame:
    """Create all features for the model."""
    df = df.copy()
    df = df.sort_values(['product_id', 'location_id', 'month'])
    
    # Temporal features
    df['month_num'] = df['month'].dt.month
    df['quarter'] = df['month'].dt.quarter
    df['year'] = df['month'].dt.year
    
    # Cyclical encoding for month
    df['month_sin'] = np.sin(2 * np.pi * df['month_num'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month_num'] / 12)
    
    # Group by product and location for lag/rolling features
    group_cols = ['product_id', 'location_id']
    
    # Lag features
    for lag in [1, 2, 3, 6, 12]:
        df[f'demand_lag_{lag}'] = df.groupby(group_cols)[target_col].shift(lag)
        df[f'sales_lag_{lag}'] = df.groupby(group_cols)['sales_qty'].shift(lag)
    
    # Rolling features (shifted by 1 to avoid leakage)
    for window in [3, 6, 12]:
        df[f'demand_rolling_mean_{window}'] = df.groupby(group_cols)[target_col].transform(
            lambda x: x.shift(1).rolling(window, min_periods=1).mean()
        )
        df[f'demand_rolling_std_{window}'] = df.groupby(group_cols)[target_col].transform(
            lambda x: x.shift(1).rolling(window, min_periods=1).std()
        )
        df[f'demand_rolling_max_{window}'] = df.groupby(group_cols)[target_col].transform(
            lambda x: x.shift(1).rolling(window, min_periods=1).max()
        )
        df[f'demand_rolling_min_{window}'] = df.groupby(group_cols)[target_col].transform(
            lambda x: x.shift(1).rolling(window, min_periods=1).min()
        )
    
    # Fill rate features
    df['fill_rate'] = df['sales_qty'] / df[target_col].replace(0, np.nan)
    df['fill_rate'] = df['fill_rate'].fillna(1.0).clip(0, 1)
    
    df['fill_rate_lag_1'] = df.groupby(group_cols)['fill_rate'].shift(1)
    df['fill_rate_rolling_3'] = df.groupby(group_cols)['fill_rate'].transform(
        lambda x: x.shift(1).rolling(3, min_periods=1).mean()
    )
    
    # Growth rate
    df['growth_rate'] = df.groupby(group_cols)[target_col].pct_change()
    df['growth_rate'] = df['growth_rate'].replace([np.inf, -np.inf], np.nan).fillna(0)
    
    # Backorder ratio
    df['backorder_ratio_lag_1'] = df.groupby(group_cols)['backorder_qty'].shift(1) / \
                                   df.groupby(group_cols)[target_col].shift(1).replace(0, np.nan)
    df['backorder_ratio_lag_1'] = df['backorder_ratio_lag_1'].fillna(0).clip(0, 1)
    
    # Same month last year
    df['demand_same_month_ly'] = df.groupby(group_cols)[target_col].shift(12)
    df['yoy_growth'] = (df[f'demand_lag_1'] - df['demand_same_month_ly']) / \
                        df['demand_same_month_ly'].replace(0, np.nan)
    df['yoy_growth'] = df['yoy_growth'].replace([np.inf, -np.inf], np.nan).fillna(0)
    
    return df


def prepare_data_for_modeling(df: pd.DataFrame, 
                               feature_cols: List[str], 
                               target_col: str,
                               cat_cols: List[str]) -> Tuple[pd.DataFrame, List[str]]:
    """Prepare data by encoding categoricals and handling missing values."""
    df = df.copy()
    
    # Encode categorical columns
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    
    # Update feature columns to use encoded versions
    final_features = []
    for col in feature_cols:
        if col in cat_cols:
            final_features.append(f'{col}_encoded')
        else:
            final_features.append(col)
    
    # Fill NaN with -1 for features (will be handled by tree models)
    for col in final_features:
        if col in df.columns:
            df[col] = df[col].fillna(-1)
    
    return df, final_features, encoders


# ============================================================
# ✂️ SPLIT STRATEGIES
# ============================================================

def simple_time_split(df: pd.DataFrame, 
                      train_end: str, 
                      val_end: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Simple time-based split."""
    train = df[df['month'] <= train_end].copy()
    val = df[(df['month'] > train_end) & (df['month'] <= val_end)].copy()
    test = df[df['month'] > val_end].copy()
    return train, val, test


def walk_forward_split(df: pd.DataFrame, 
                       n_folds: int = 6,
                       test_months: int = 1) -> List[Tuple[pd.DataFrame, pd.DataFrame]]:
    """Walk-forward validation splits."""
    months = sorted(df['month'].unique())
    
    # Start from at least 12 months of training data
    min_train_months = 12
    
    folds = []
    for i in range(n_folds):
        test_start_idx = len(months) - n_folds - 1 + i
        if test_start_idx < min_train_months:
            continue
            
        train_months = months[:test_start_idx]
        test_month = months[test_start_idx:test_start_idx + test_months]
        
        train = df[df['month'].isin(train_months)].copy()
        test = df[df['month'].isin(test_month)].copy()
        
        if len(train) > 0 and len(test) > 0:
            folds.append((train, test))
    
    return folds


# ============================================================
# 🤖 MODEL DEFINITIONS
# ============================================================

def get_model_configs() -> Dict[str, List[Dict]]:
    """Define models and their hyperparameter configurations."""
    
    configs = {
        'LightGBM': [
            {
                'name': 'LightGBM_default',
                'params': {
                    'objective': 'regression',
                    'metric': 'mae',
                    'verbosity': -1,
                    'n_estimators': 500,
                    'learning_rate': 0.05,
                    'num_leaves': 31,
                    'feature_fraction': 0.8,
                    'bagging_fraction': 0.8,
                    'bagging_freq': 5,
                    'early_stopping_rounds': 50
                }
            },
            {
                'name': 'LightGBM_deep',
                'params': {
                    'objective': 'regression',
                    'metric': 'mae',
                    'verbosity': -1,
                    'n_estimators': 1000,
                    'learning_rate': 0.01,
                    'num_leaves': 63,
                    'max_depth': 10,
                    'feature_fraction': 0.7,
                    'bagging_fraction': 0.7,
                    'bagging_freq': 5,
                    'early_stopping_rounds': 100
                }
            },
            {
                'name': 'LightGBM_shallow',
                'params': {
                    'objective': 'regression',
                    'metric': 'mae',
                    'verbosity': -1,
                    'n_estimators': 300,
                    'learning_rate': 0.1,
                    'num_leaves': 15,
                    'max_depth': 5,
                    'feature_fraction': 0.9,
                    'bagging_fraction': 0.9,
                    'bagging_freq': 3,
                    'early_stopping_rounds': 30
                }
            }
        ],
        'XGBoost': [
            {
                'name': 'XGBoost_default',
                'params': {
                    'objective': 'reg:squarederror',
                    'n_estimators': 500,
                    'learning_rate': 0.05,
                    'max_depth': 6,
                    'subsample': 0.8,
                    'colsample_bytree': 0.8,
                    'early_stopping_rounds': 50,
                    'verbosity': 0
                }
            },
            {
                'name': 'XGBoost_deep',
                'params': {
                    'objective': 'reg:squarederror',
                    'n_estimators': 1000,
                    'learning_rate': 0.01,
                    'max_depth': 10,
                    'subsample': 0.7,
                    'colsample_bytree': 0.7,
                    'early_stopping_rounds': 100,
                    'verbosity': 0
                }
            }
        ],
        'RandomForest': [
            {
                'name': 'RF_default',
                'params': {
                    'n_estimators': 200,
                    'max_depth': 15,
                    'min_samples_split': 5,
                    'min_samples_leaf': 2,
                    'n_jobs': -1,
                    'random_state': 42
                }
            },
            {
                'name': 'RF_deep',
                'params': {
                    'n_estimators': 500,
                    'max_depth': 25,
                    'min_samples_split': 2,
                    'min_samples_leaf': 1,
                    'n_jobs': -1,
                    'random_state': 42
                }
            }
        ],
        'Ridge': [
            {
                'name': 'Ridge_alpha1',
                'params': {'alpha': 1.0}
            },
            {
                'name': 'Ridge_alpha10',
                'params': {'alpha': 10.0}
            },
            {
                'name': 'Ridge_alpha100',
                'params': {'alpha': 100.0}
            }
        ]
    }
    
    return configs


def train_model(model_type: str, 
                params: Dict, 
                X_train: pd.DataFrame, 
                y_train: pd.Series,
                X_val: pd.DataFrame = None,
                y_val: pd.Series = None) -> Any:
    """Train a model with given parameters."""
    
    if model_type == 'LightGBM':
        early_stopping = params.pop('early_stopping_rounds', None)
        model = lgb.LGBMRegressor(**params)
        
        if X_val is not None and early_stopping:
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(early_stopping, verbose=False)]
            )
        else:
            model.fit(X_train, y_train)
        
        params['early_stopping_rounds'] = early_stopping
        
    elif model_type == 'XGBoost':
        early_stopping = params.pop('early_stopping_rounds', None)
        model = xgb.XGBRegressor(**params)
        
        if X_val is not None and early_stopping:
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
        else:
            model.fit(X_train, y_train)
        
        params['early_stopping_rounds'] = early_stopping
        
    elif model_type == 'RandomForest':
        model = RandomForestRegressor(**params)
        model.fit(X_train, y_train)
        
    elif model_type == 'Ridge':
        model = Ridge(**params)
        model.fit(X_train, y_train)
    
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    return model


# ============================================================
# 🔬 EXPERIMENT RUNNER
# ============================================================

def run_experiment(df: pd.DataFrame,
                   feature_cols: List[str],
                   target_col: str,
                   cat_cols: List[str]) -> pd.DataFrame:
    """Run the complete experiment with all models and splits."""
    
    results = []
    model_configs = get_model_configs()
    
    print("="*80)
    print("🔬 STARTING DEMAND FORECASTING EXPERIMENT")
    print("="*80)
    print(f"\n📊 Dataset: {len(df):,} rows")
    print(f"📅 Period: {df['month'].min()} to {df['month'].max()}")
    print(f"🎯 Target: {target_col}")
    print(f"🔧 Features: {len(feature_cols)}")
    
    # Prepare data
    df_prep, final_features, encoders = prepare_data_for_modeling(
        df, feature_cols, target_col, cat_cols
    )
    
    # Remove rows with NaN target
    df_prep = df_prep.dropna(subset=[target_col])
    
    # ============================================================
    # STRATEGY 1: Simple Time Split
    # ============================================================
    print("\n" + "="*80)
    print("📌 STRATEGY 1: Simple Time Split")
    print("="*80)
    
    # Define split points
    all_months = sorted(df_prep['month'].unique())
    train_end = all_months[-8]  # ~6 months for val+test
    val_end = all_months[-4]    # ~3 months for test
    
    train, val, test = simple_time_split(df_prep, train_end, val_end)
    
    print(f"\n   Train: {train['month'].min()} to {train['month'].max()} ({len(train):,} rows)")
    print(f"   Val:   {val['month'].min()} to {val['month'].max()} ({len(val):,} rows)")
    print(f"   Test:  {test['month'].min()} to {test['month'].max()} ({len(test):,} rows)")
    
    # Prepare X, y
    X_train = train[final_features]
    y_train = train[target_col]
    X_val = val[final_features]
    y_val = val[target_col]
    X_test = test[final_features]
    y_test = test[target_col]
    
    for model_type, configs in model_configs.items():
        for config in configs:
            print(f"\n   🤖 Training {config['name']}...")
            
            try:
                model = train_model(
                    model_type, 
                    config['params'].copy(),
                    X_train, y_train,
                    X_val, y_val
                )
                
                # Predict on test set
                y_pred = model.predict(X_test)
                y_pred = np.clip(y_pred, 0, None)  # No negative predictions
                
                # Calculate metrics
                metrics = calculate_metrics(y_test.values, y_pred)
                
                results.append({
                    'strategy': 'Simple_Split',
                    'model': config['name'],
                    'model_type': model_type,
                    **metrics,
                    'train_size': len(train),
                    'test_size': len(test)
                })
                
                print(f"      ✅ WMAPE: {metrics['WMAPE']}%, MAE: {metrics['MAE']}")
                
            except Exception as e:
                print(f"      ❌ Error: {str(e)}")
    
    # ============================================================
    # STRATEGY 2: Walk-Forward Validation
    # ============================================================
    print("\n" + "="*80)
    print("📌 STRATEGY 2: Walk-Forward Validation")
    print("="*80)
    
    folds = walk_forward_split(df_prep, n_folds=6, test_months=1)
    print(f"\n   Created {len(folds)} folds")
    
    for model_type, configs in model_configs.items():
        for config in configs:
            print(f"\n   🤖 Training {config['name']} (Walk-Forward)...")
            
            fold_metrics = []
            
            for fold_idx, (fold_train, fold_test) in enumerate(folds):
                try:
                    X_fold_train = fold_train[final_features]
                    y_fold_train = fold_train[target_col]
                    X_fold_test = fold_test[final_features]
                    y_fold_test = fold_test[target_col]
                    
                    # Split train into train/val for early stopping
                    train_months = sorted(fold_train['month'].unique())
                    val_month = train_months[-1]
                    
                    inner_train = fold_train[fold_train['month'] < val_month]
                    inner_val = fold_train[fold_train['month'] == val_month]
                    
                    X_inner_train = inner_train[final_features]
                    y_inner_train = inner_train[target_col]
                    X_inner_val = inner_val[final_features]
                    y_inner_val = inner_val[target_col]
                    
                    model = train_model(
                        model_type,
                        config['params'].copy(),
                        X_inner_train, y_inner_train,
                        X_inner_val, y_inner_val
                    )
                    
                    y_pred = model.predict(X_fold_test)
                    y_pred = np.clip(y_pred, 0, None)
                    
                    metrics = calculate_metrics(y_fold_test.values, y_pred)
                    fold_metrics.append(metrics)
                    
                except Exception as e:
                    print(f"      ⚠️ Fold {fold_idx} error: {str(e)}")
            
            if fold_metrics:
                # Average metrics across folds
                avg_metrics = {}
                for key in fold_metrics[0].keys():
                    values = [m[key] for m in fold_metrics if m[key] is not None]
                    if values:
                        avg_metrics[key] = round(np.mean(values), 2)
                    else:
                        avg_metrics[key] = None
                
                results.append({
                    'strategy': 'Walk_Forward',
                    'model': config['name'],
                    'model_type': model_type,
                    **avg_metrics,
                    'train_size': np.mean([len(f[0]) for f in folds]),
                    'test_size': np.mean([len(f[1]) for f in folds]),
                    'n_folds': len(folds)
                })
                
                print(f"      ✅ Avg WMAPE: {avg_metrics.get('WMAPE')}%, Avg MAE: {avg_metrics.get('MAE')}")
    
    # Convert to DataFrame
    results_df = pd.DataFrame(results)
    
    return results_df


def print_final_results(results_df: pd.DataFrame):
    """Print formatted final results and recommendations."""
    
    print("\n" + "="*80)
    print("📊 FINAL RESULTS - ALL EXPERIMENTS")
    print("="*80)
    
    # Sort by WMAPE (lower is better)
    results_sorted = results_df.sort_values('WMAPE')
    
    print("\n🏆 RANKING BY WMAPE (Lower is Better):\n")
    print(results_sorted[['strategy', 'model', 'WMAPE', 'MAPE', 'MAE', 'Bias', 'Accuracy_20pct']].to_string(index=False))
    
    # Best model
    best = results_sorted.iloc[0]
    
    print("\n" + "="*80)
    print("🥇 BEST MODEL RECOMMENDATION")
    print("="*80)
    print(f"\n   Model:     {best['model']}")
    print(f"   Strategy:  {best['strategy']}")
    print(f"   WMAPE:     {best['WMAPE']}%")
    print(f"   MAPE:      {best['MAPE']}%")
    print(f"   MAE:       {best['MAE']}")
    print(f"   Bias:      {best['Bias']}")
    print(f"   Accuracy (±20%): {best['Accuracy_20pct']}%")
    
    # Comparison by model type
    print("\n" + "="*80)
    print("📈 AVERAGE PERFORMANCE BY MODEL TYPE")
    print("="*80)
    
    by_model_type = results_df.groupby('model_type').agg({
        'WMAPE': 'mean',
        'MAPE': 'mean',
        'MAE': 'mean'
    }).round(2).sort_values('WMAPE')
    
    print(f"\n{by_model_type.to_string()}")
    
    # Comparison by strategy
    print("\n" + "="*80)
    print("📈 AVERAGE PERFORMANCE BY STRATEGY")
    print("="*80)
    
    by_strategy = results_df.groupby('strategy').agg({
        'WMAPE': 'mean',
        'MAPE': 'mean',
        'MAE': 'mean'
    }).round(2).sort_values('WMAPE')
    
    print(f"\n{by_strategy.to_string()}")
    
    return best


# ============================================================
# 📊 VISUALIZATION: BEST MODEL COMPARISON
# ============================================================

def train_best_model_and_visualize(df: pd.DataFrame,
                                    best_model_info: pd.Series,
                                    feature_cols: List[str],
                                    target_col: str,
                                    cat_cols: List[str]):
    """Train the best model and create visualization comparing Sales vs Real Demand vs Predicted."""
    
    print("\n" + "="*80)
    print("📊 TRAINING BEST MODEL FOR VISUALIZATION")
    print("="*80)
    
    model_name = best_model_info['model']
    model_type = best_model_info['model_type']
    
    print(f"\n   Best model: {model_name}")
    
    # Get model config
    model_configs = get_model_configs()
    config = None
    for cfg in model_configs[model_type]:
        if cfg['name'] == model_name:
            config = cfg
            break
    
    if config is None:
        print("   ❌ Could not find model configuration")
        return
    
    # Prepare data
    df_prep, final_features, encoders = prepare_data_for_modeling(
        df, feature_cols, target_col, cat_cols
    )
    df_prep = df_prep.dropna(subset=[target_col])
    
    # Simple time split
    all_months = sorted(df_prep['month'].unique())
    train_end = all_months[-8]
    val_end = all_months[-4]
    
    train, val, test = simple_time_split(df_prep, train_end, val_end)
    
    # Combine train + val for final training
    train_full = pd.concat([train, val])
    
    X_train = train_full[final_features]
    y_train = train_full[target_col]
    X_test = test[final_features]
    y_test = test[target_col]
    
    # Train model
    print(f"   Training on {len(train_full):,} rows...")
    model = train_model(
        model_type,
        config['params'].copy(),
        X_train, y_train,
        None, None
    )
    
    # Predict
    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0, None)
    
    # Add predictions to test dataframe
    test = test.copy()
    test['predicted_demand'] = y_pred
    
    # Aggregate by month for visualization
    monthly_comparison = test.groupby('month').agg({
        'sales_qty': 'sum',
        'real_demand_qty': 'sum',
        'predicted_demand': 'sum',
        'backorder_qty': 'sum'
    }).reset_index()
    
    monthly_comparison['month_str'] = monthly_comparison['month'].astype(str)
    
    # Calculate metrics on aggregated data
    agg_metrics = calculate_metrics(
        monthly_comparison['real_demand_qty'].values,
        monthly_comparison['predicted_demand'].values
    )
    
    print(f"\n   📈 Aggregated Monthly Metrics:")
    print(f"      WMAPE: {agg_metrics['WMAPE']}%")
    print(f"      MAE: {agg_metrics['MAE']:,.0f}")
    print(f"      Bias: {agg_metrics['Bias']:,.0f}")
    
    # ============================================================
    # CREATE VISUALIZATIONS
    # ============================================================
    
    fig, axes = plt.subplots(2, 2, figsize=(18, 14))
    
    # Colors
    color_sales = '#3498db'       # Blue
    color_real = '#e74c3c'        # Red
    color_pred = '#2ecc71'        # Green
    color_backorder = '#f39c12'   # Orange
    
    # ----------------------------------------------------------------
    # Plot 1: Time Series - Sales vs Real Demand vs Predicted
    # ----------------------------------------------------------------
    ax1 = axes[0, 0]
    
    x = range(len(monthly_comparison))
    width = 0.25
    
    bars1 = ax1.bar([i - width for i in x], monthly_comparison['sales_qty'], 
                    width, label='Ventas Registradas', color=color_sales, alpha=0.8)
    bars2 = ax1.bar(x, monthly_comparison['real_demand_qty'], 
                    width, label='Demanda Real', color=color_real, alpha=0.8)
    bars3 = ax1.bar([i + width for i in x], monthly_comparison['predicted_demand'], 
                    width, label='Demanda Predicha', color=color_pred, alpha=0.8)
    
    ax1.set_xlabel('Mes', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Cantidad (Unidades)', fontsize=12, fontweight='bold')
    ax1.set_title('📊 Comparación Mensual: Ventas vs Demanda Real vs Predicción', 
                  fontsize=14, fontweight='bold', pad=15)
    ax1.set_xticks(x)
    ax1.set_xticklabels(monthly_comparison['month_str'], rotation=45, ha='right')
    ax1.legend(fontsize=11, loc='upper left')
    ax1.grid(True, alpha=0.3, axis='y')
    
    # Add values on top of bars
    for i, (s, r, p) in enumerate(zip(monthly_comparison['sales_qty'], 
                                       monthly_comparison['real_demand_qty'],
                                       monthly_comparison['predicted_demand'])):
        ax1.text(i, r * 1.02, f'{r:,.0f}', ha='center', va='bottom', fontsize=8, color=color_real)
    
    # ----------------------------------------------------------------
    # Plot 2: Line Chart - Trend Comparison
    # ----------------------------------------------------------------
    ax2 = axes[0, 1]
    
    ax2.plot(monthly_comparison['month_str'], monthly_comparison['sales_qty'], 
             marker='o', linewidth=2.5, markersize=8, color=color_sales, 
             label='Ventas Registradas')
    ax2.plot(monthly_comparison['month_str'], monthly_comparison['real_demand_qty'], 
             marker='s', linewidth=2.5, markersize=8, color=color_real, 
             label='Demanda Real')
    ax2.plot(monthly_comparison['month_str'], monthly_comparison['predicted_demand'], 
             marker='^', linewidth=2.5, markersize=8, color=color_pred, 
             label='Demanda Predicha', linestyle='--')
    
    # Fill area between sales and real demand (lost demand)
    ax2.fill_between(monthly_comparison['month_str'], 
                     monthly_comparison['sales_qty'], 
                     monthly_comparison['real_demand_qty'],
                     alpha=0.2, color=color_backorder, label='Demanda Perdida (Backorder)')
    
    ax2.set_xlabel('Mes', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Cantidad (Unidades)', fontsize=12, fontweight='bold')
    ax2.set_title('📈 Tendencia: El Modelo Captura la Demanda Real', 
                  fontsize=14, fontweight='bold', pad=15)
    ax2.legend(fontsize=10, loc='upper left')
    ax2.tick_params(axis='x', rotation=45)
    ax2.grid(True, alpha=0.3)
    
    # ----------------------------------------------------------------
    # Plot 3: Scatter - Predicted vs Actual
    # ----------------------------------------------------------------
    ax3 = axes[1, 0]
    
    ax3.scatter(test['real_demand_qty'], test['predicted_demand'], 
                alpha=0.3, color=color_pred, s=20)
    
    # Perfect prediction line
    max_val = max(test['real_demand_qty'].max(), test['predicted_demand'].max())
    ax3.plot([0, max_val], [0, max_val], 'r--', linewidth=2, label='Predicción Perfecta')
    
    # Add ±20% bands
    ax3.fill_between([0, max_val], [0, max_val*0.8], [0, max_val*1.2], 
                     alpha=0.1, color='green', label='±20% Error')
    
    ax3.set_xlabel('Demanda Real', fontsize=12, fontweight='bold')
    ax3.set_ylabel('Demanda Predicha', fontsize=12, fontweight='bold')
    ax3.set_title(f'🎯 Predicción vs Real (WMAPE: {agg_metrics["WMAPE"]}%)', 
                  fontsize=14, fontweight='bold', pad=15)
    ax3.legend(fontsize=10)
    ax3.grid(True, alpha=0.3)
    
    # ----------------------------------------------------------------
    # Plot 4: Error Analysis
    # ----------------------------------------------------------------
    ax4 = axes[1, 1]
    
    # Calculate percentage error per month
    monthly_comparison['pct_error'] = (
        (monthly_comparison['predicted_demand'] - monthly_comparison['real_demand_qty']) / 
        monthly_comparison['real_demand_qty'] * 100
    )
    
    colors = [color_pred if e >= 0 else color_real for e in monthly_comparison['pct_error']]
    bars = ax4.bar(monthly_comparison['month_str'], monthly_comparison['pct_error'], 
                   color=colors, alpha=0.8, edgecolor='black', linewidth=0.5)
    
    ax4.axhline(y=0, color='black', linestyle='-', linewidth=1)
    ax4.axhline(y=20, color='green', linestyle='--', linewidth=1.5, alpha=0.7, label='±20% threshold')
    ax4.axhline(y=-20, color='green', linestyle='--', linewidth=1.5, alpha=0.7)
    
    ax4.set_xlabel('Mes', fontsize=12, fontweight='bold')
    ax4.set_ylabel('Error de Predicción (%)', fontsize=12, fontweight='bold')
    ax4.set_title('📉 Error de Predicción por Mes (+ = Sobreestima, - = Subestima)', 
                  fontsize=14, fontweight='bold', pad=15)
    ax4.tick_params(axis='x', rotation=45)
    ax4.legend(fontsize=10)
    ax4.grid(True, alpha=0.3, axis='y')
    
    # Add value labels
    for i, (bar, err) in enumerate(zip(bars, monthly_comparison['pct_error'])):
        ax4.text(bar.get_x() + bar.get_width()/2, err + (2 if err >= 0 else -4),
                f'{err:.1f}%', ha='center', va='bottom' if err >= 0 else 'top', 
                fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('best_model_comparison.png', dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.show()
    
    print(f"\n   💾 Chart saved to best_model_comparison.png")
    
    # ============================================================
    # SUMMARY TABLE
    # ============================================================
    print("\n" + "="*80)
    print("📋 RESUMEN MENSUAL: VENTAS vs DEMANDA REAL vs PREDICCIÓN")
    print("="*80)
    
    summary = monthly_comparison[['month_str', 'sales_qty', 'real_demand_qty', 
                                   'predicted_demand', 'backorder_qty']].copy()
    summary.columns = ['Mes', 'Ventas', 'Demanda Real', 'Predicción', 'Backorder']
    
    # Add derived columns
    summary['Demanda Perdida %'] = (summary['Backorder'] / summary['Demanda Real'] * 100).round(1)
    summary['Error Pred %'] = ((summary['Predicción'] - summary['Demanda Real']) / 
                               summary['Demanda Real'] * 100).round(1)
    
    # Format numbers
    for col in ['Ventas', 'Demanda Real', 'Predicción', 'Backorder']:
        summary[col] = summary[col].apply(lambda x: f'{x:,.0f}')
    
    print(f"\n{summary.to_string(index=False)}")
    
    # Final insight
    total_sales = monthly_comparison['sales_qty'].sum()
    total_real = monthly_comparison['real_demand_qty'].sum()
    total_pred = monthly_comparison['predicted_demand'].sum()
    total_backorder = monthly_comparison['backorder_qty'].sum()
    
    print("\n" + "="*80)
    print("💡 INSIGHT CLAVE")
    print("="*80)
    print(f"\n   📦 Si proyectaras con VENTAS:        {total_sales:,.0f} unidades")
    print(f"   🎯 Si proyectaras con PREDICCIÓN:    {total_pred:,.0f} unidades")
    print(f"   ✅ DEMANDA REAL:                     {total_real:,.0f} unidades")
    print(f"\n   🚨 Usando solo ventas perderías ~{(total_real - total_sales)/total_real*100:.1f}% de la demanda")
    print(f"   ✨ El modelo captura el {100 - abs(total_pred - total_real)/total_real*100:.1f}% de la demanda real")
    
    return test, monthly_comparison


# ============================================================
# 🚀 MAIN EXECUTION
# ============================================================

def main():
    """Main execution function."""
    
    print("\n" + "🚀"*40)
    print("\n   DEMAND FORECASTING ML EXPERIMENT")
    print("\n" + "🚀"*40)
    
    # Load data
    print("\n📂 Loading data...")
    df = pd.read_csv('export.csv', parse_dates=['date'])
    
    print(f"   Loaded {len(df):,} rows")
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    
    # Aggregate to monthly
    print("\n📊 Aggregating to monthly level...")
    df['month'] = df['date'].dt.to_period('M')
    
    monthly_df = df.groupby(['month', 'product_id', 'location_id']).agg({
        'sales_qty': 'sum',
        'sales_amount': 'sum',
        'backorder_qty': 'sum',
        'backorder_amount': 'sum',
        'real_demand_qty': 'sum',
        'real_demand_amount': 'sum'
    }).reset_index()
    
    # Calculate fill_rate at monthly level
    monthly_df['fill_rate'] = monthly_df['sales_qty'] / monthly_df['real_demand_qty'].replace(0, np.nan)
    monthly_df['fill_rate'] = monthly_df['fill_rate'].fillna(1.0).clip(0, 1)
    
    print(f"   Monthly aggregation: {len(monthly_df):,} rows")
    print(f"   Unique products: {monthly_df['product_id'].nunique()}")
    print(f"   Unique locations: {monthly_df['location_id'].nunique()}")
    print(f"   Months: {monthly_df['month'].nunique()}")
    
    # Exclude incomplete months (last month might be incomplete)
    last_complete_month = monthly_df['month'].max() - 1
    monthly_df = monthly_df[monthly_df['month'] <= last_complete_month]
    print(f"   After removing incomplete month: {len(monthly_df):,} rows")
    
    # Create features
    print("\n🔧 Creating features...")
    monthly_df = create_features(monthly_df, target_col='real_demand_qty')
    
    # Define feature columns
    feature_cols = [
        # Categorical
        'product_id', 'location_id',
        # Temporal
        'month_num', 'quarter', 'year', 'month_sin', 'month_cos',
        # Lags
        'demand_lag_1', 'demand_lag_2', 'demand_lag_3', 'demand_lag_6', 'demand_lag_12',
        'sales_lag_1', 'sales_lag_2', 'sales_lag_3',
        # Rolling
        'demand_rolling_mean_3', 'demand_rolling_mean_6', 'demand_rolling_mean_12',
        'demand_rolling_std_3', 'demand_rolling_std_6',
        'demand_rolling_max_3', 'demand_rolling_min_3',
        # Fill rate
        'fill_rate_lag_1', 'fill_rate_rolling_3',
        # Growth
        'growth_rate', 'backorder_ratio_lag_1',
        # YoY
        'demand_same_month_ly', 'yoy_growth'
    ]
    
    cat_cols = ['product_id', 'location_id']
    target_col = 'real_demand_qty'
    
    # Filter to rows where we have enough history (at least 3 lags)
    monthly_df = monthly_df.dropna(subset=['demand_lag_3'])
    print(f"   After requiring 3 months history: {len(monthly_df):,} rows")
    
    # Run experiment
    results_df = run_experiment(monthly_df, feature_cols, target_col, cat_cols)
    
    # Print final results
    best_model = print_final_results(results_df)
    
    # Save results
    results_df.to_csv('experiment_results.csv', index=False)
    print(f"\n💾 Results saved to experiment_results.csv")
    
    # ============================================================
    # VISUALIZE BEST MODEL
    # ============================================================
    test_predictions, monthly_summary = train_best_model_and_visualize(
        monthly_df,
        best_model,
        feature_cols,
        target_col,
        cat_cols
    )
    
    print("\n" + "="*80)
    print("✅ EXPERIMENT COMPLETE!")
    print("="*80)
    
    return results_df, best_model, test_predictions, monthly_summary


if __name__ == "__main__":
    results, best, predictions, summary = main()

