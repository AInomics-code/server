"""
🎯 Demand Prediction Module
===========================
This module provides functions to:
1. Train and save the best model (Random Forest)
2. Predict demand for individual product-location-month combinations

Usage:
    # Train and save model
    python predict_demand.py --train
    
    # Predict for a specific product-location-month
    python predict_demand.py --predict --product "106-DOC" --location "01" --month "2025-12"
"""

import pandas as pd
import numpy as np
import pickle
import argparse
from datetime import datetime
from typing import Dict, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = 'demand_model.pkl'
ENCODERS_PATH = 'demand_encoders.pkl'
HISTORY_PATH = 'demand_history.pkl'
DATA_PATH = 'export.csv'

FEATURE_COLS = [
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
    'demand_same_month_ly', 'yoy_growth',
    # Categorical (encoded)
    'product_id_encoded', 'location_id_encoded'
]


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def create_features(df: pd.DataFrame, target_col: str = 'real_demand_qty') -> pd.DataFrame:
    """Create all features for the model."""
    df = df.copy()
    df = df.sort_values(['product_id', 'location_id', 'month'])
    
    # Temporal features
    df['month_num'] = df['month'].dt.month
    df['quarter'] = df['month'].dt.quarter
    df['year'] = df['month'].dt.year
    df['month_sin'] = np.sin(2 * np.pi * df['month_num'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month_num'] / 12)
    
    group_cols = ['product_id', 'location_id']
    
    # Lag features
    for lag in [1, 2, 3, 6, 12]:
        df[f'demand_lag_{lag}'] = df.groupby(group_cols)[target_col].shift(lag)
        if lag <= 3:
            df[f'sales_lag_{lag}'] = df.groupby(group_cols)['sales_qty'].shift(lag)
    
    # Rolling features
    for window in [3, 6, 12]:
        df[f'demand_rolling_mean_{window}'] = df.groupby(group_cols)[target_col].transform(
            lambda x: x.shift(1).rolling(window, min_periods=1).mean()
        )
        if window <= 6:
            df[f'demand_rolling_std_{window}'] = df.groupby(group_cols)[target_col].transform(
                lambda x: x.shift(1).rolling(window, min_periods=1).std()
            )
        if window == 3:
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


# ============================================================
# TRAINING
# ============================================================

def train_and_save_model():
    """Train the Random Forest model and save it with encoders."""
    
    print("="*60)
    print("🚀 TRAINING DEMAND PREDICTION MODEL")
    print("="*60)
    
    # Load data
    print("\n📂 Loading data...")
    df = pd.read_csv(DATA_PATH, parse_dates=['date'])
    df['month'] = df['date'].dt.to_period('M')
    
    # Aggregate to monthly
    print("📊 Aggregating to monthly...")
    monthly_df = df.groupby(['month', 'product_id', 'location_id']).agg({
        'sales_qty': 'sum',
        'sales_amount': 'sum',
        'backorder_qty': 'sum',
        'backorder_amount': 'sum',
        'real_demand_qty': 'sum',
        'real_demand_amount': 'sum'
    }).reset_index()
    
    monthly_df['fill_rate'] = monthly_df['sales_qty'] / monthly_df['real_demand_qty'].replace(0, np.nan)
    monthly_df['fill_rate'] = monthly_df['fill_rate'].fillna(1.0).clip(0, 1)
    
    # Exclude last month (potentially incomplete)
    last_complete_month = monthly_df['month'].max() - 1
    monthly_df = monthly_df[monthly_df['month'] <= last_complete_month]
    
    # Create features
    print("🔧 Creating features...")
    monthly_df = create_features(monthly_df)
    
    # Encode categorical
    print("🏷️ Encoding categoricals...")
    encoders = {}
    
    le_product = LabelEncoder()
    monthly_df['product_id_encoded'] = le_product.fit_transform(monthly_df['product_id'].astype(str))
    encoders['product_id'] = le_product
    
    le_location = LabelEncoder()
    monthly_df['location_id_encoded'] = le_location.fit_transform(monthly_df['location_id'].astype(str))
    encoders['location_id'] = le_location
    
    # Filter rows with enough history
    monthly_df = monthly_df.dropna(subset=['demand_lag_3'])
    
    # Fill remaining NaN
    for col in FEATURE_COLS:
        if col in monthly_df.columns:
            monthly_df[col] = monthly_df[col].fillna(-1)
    
    # Prepare training data
    X = monthly_df[FEATURE_COLS]
    y = monthly_df['real_demand_qty']
    
    print(f"\n📈 Training on {len(X):,} samples...")
    
    # Train Random Forest (best model from experiment)
    model = RandomForestRegressor(
        n_estimators=500,
        max_depth=25,
        min_samples_split=2,
        min_samples_leaf=1,
        n_jobs=-1,
        random_state=42
    )
    
    model.fit(X, y)
    print("✅ Model trained!")
    
    # Save history for future predictions
    print("\n💾 Saving model and artifacts...")
    
    # Keep only recent history needed for features
    history_df = monthly_df[['month', 'product_id', 'location_id', 
                             'sales_qty', 'real_demand_qty', 'backorder_qty', 'fill_rate']].copy()
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    with open(ENCODERS_PATH, 'wb') as f:
        pickle.dump(encoders, f)
    
    with open(HISTORY_PATH, 'wb') as f:
        pickle.dump(history_df, f)
    
    print(f"   ✅ Model saved to {MODEL_PATH}")
    print(f"   ✅ Encoders saved to {ENCODERS_PATH}")
    print(f"   ✅ History saved to {HISTORY_PATH}")
    
    print("\n" + "="*60)
    print("✅ TRAINING COMPLETE!")
    print("="*60)
    
    return model, encoders, history_df


# ============================================================
# PREDICTION
# ============================================================

def load_model() -> Tuple:
    """Load the trained model and artifacts."""
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(ENCODERS_PATH, 'rb') as f:
            encoders = pickle.load(f)
        with open(HISTORY_PATH, 'rb') as f:
            history = pickle.load(f)
        return model, encoders, history
    except FileNotFoundError:
        raise FileNotFoundError(
            "Model not found! Run with --train first:\n"
            "  python predict_demand.py --train"
        )


def predict_single(product_id: str, 
                   location_id: str, 
                   target_month: str,
                   model=None, 
                   encoders=None, 
                   history=None) -> Dict:
    """
    Predict demand for a single product-location-month combination.
    
    Args:
        product_id: Product code (e.g., "106-DOC")
        location_id: Location/warehouse code (e.g., "01")
        target_month: Month to predict (e.g., "2025-12")
        model: Pre-loaded model (optional)
        encoders: Pre-loaded encoders (optional)
        history: Pre-loaded history (optional)
    
    Returns:
        Dictionary with prediction and details
    """
    
    # Load model if not provided
    if model is None or encoders is None or history is None:
        model, encoders, history = load_model()
    
    # Parse target month
    target_period = pd.Period(target_month, freq='M')
    
    # Check if product and location exist in training data
    if product_id not in encoders['product_id'].classes_:
        return {
            'error': f"Product '{product_id}' not found in training data",
            'available_products': list(encoders['product_id'].classes_[:10]) + ['...']
        }
    
    if str(location_id) not in encoders['location_id'].classes_:
        return {
            'error': f"Location '{location_id}' not found in training data",
            'available_locations': list(encoders['location_id'].classes_)
        }
    
    # Get history for this product-location
    mask = (history['product_id'] == product_id) & (history['location_id'].astype(str) == str(location_id))
    product_history = history[mask].sort_values('month')
    
    if len(product_history) < 3:
        return {
            'error': f"Not enough history for product '{product_id}' at location '{location_id}'",
            'available_months': len(product_history)
        }
    
    # Build features for prediction
    features = {}
    
    # Temporal features
    features['month_num'] = target_period.month
    features['quarter'] = (target_period.month - 1) // 3 + 1
    features['year'] = target_period.year
    features['month_sin'] = np.sin(2 * np.pi * features['month_num'] / 12)
    features['month_cos'] = np.cos(2 * np.pi * features['month_num'] / 12)
    
    # Get recent demand values
    recent = product_history.tail(12).set_index('month')['real_demand_qty']
    recent_sales = product_history.tail(12).set_index('month')['sales_qty']
    recent_fill = product_history.tail(12).set_index('month')['fill_rate']
    recent_backorder = product_history.tail(12).set_index('month')['backorder_qty']
    
    # Lag features (relative to target month)
    for lag in [1, 2, 3, 6, 12]:
        lag_month = target_period - lag
        features[f'demand_lag_{lag}'] = recent.get(lag_month, -1)
        if lag <= 3:
            features[f'sales_lag_{lag}'] = recent_sales.get(lag_month, -1)
    
    # Rolling features (based on last 12 months before target)
    available_values = [v for v in recent.values if v > 0]
    
    if len(available_values) >= 3:
        features['demand_rolling_mean_3'] = np.mean(available_values[-3:])
        features['demand_rolling_std_3'] = np.std(available_values[-3:])
        features['demand_rolling_max_3'] = np.max(available_values[-3:])
        features['demand_rolling_min_3'] = np.min(available_values[-3:])
    else:
        features['demand_rolling_mean_3'] = -1
        features['demand_rolling_std_3'] = -1
        features['demand_rolling_max_3'] = -1
        features['demand_rolling_min_3'] = -1
    
    if len(available_values) >= 6:
        features['demand_rolling_mean_6'] = np.mean(available_values[-6:])
        features['demand_rolling_std_6'] = np.std(available_values[-6:])
    else:
        features['demand_rolling_mean_6'] = features.get('demand_rolling_mean_3', -1)
        features['demand_rolling_std_6'] = -1
    
    if len(available_values) >= 12:
        features['demand_rolling_mean_12'] = np.mean(available_values[-12:])
    else:
        features['demand_rolling_mean_12'] = features.get('demand_rolling_mean_6', -1)
    
    # Fill rate features
    lag1_month = target_period - 1
    features['fill_rate_lag_1'] = recent_fill.get(lag1_month, 1.0)
    features['fill_rate_rolling_3'] = recent_fill.tail(3).mean() if len(recent_fill) >= 3 else 1.0
    
    # Growth rate
    if len(recent) >= 2:
        last_two = list(recent.tail(2))
        if last_two[0] > 0:
            features['growth_rate'] = (last_two[1] - last_two[0]) / last_two[0]
        else:
            features['growth_rate'] = 0
    else:
        features['growth_rate'] = 0
    
    # Backorder ratio
    lag1_demand = features['demand_lag_1']
    lag1_backorder = recent_backorder.get(lag1_month, 0)
    if lag1_demand > 0:
        features['backorder_ratio_lag_1'] = lag1_backorder / lag1_demand
    else:
        features['backorder_ratio_lag_1'] = 0
    
    # Same month last year
    same_month_ly = target_period - 12
    features['demand_same_month_ly'] = recent.get(same_month_ly, -1)
    
    # YoY growth
    if features['demand_same_month_ly'] > 0 and features['demand_lag_1'] > 0:
        features['yoy_growth'] = (features['demand_lag_1'] - features['demand_same_month_ly']) / features['demand_same_month_ly']
    else:
        features['yoy_growth'] = 0
    
    # Encode categoricals
    features['product_id_encoded'] = encoders['product_id'].transform([product_id])[0]
    features['location_id_encoded'] = encoders['location_id'].transform([str(location_id)])[0]
    
    # Create feature vector
    X = pd.DataFrame([features])[FEATURE_COLS]
    
    # Predict
    prediction = model.predict(X)[0]
    prediction = max(0, prediction)  # No negative predictions
    
    # Get recent actual values for context
    last_month = product_history.iloc[-1]
    
    return {
        'product_id': product_id,
        'location_id': location_id,
        'target_month': target_month,
        'predicted_demand_qty': round(prediction, 2),
        'context': {
            'last_month': str(last_month['month']),
            'last_month_demand': round(last_month['real_demand_qty'], 2),
            'last_month_sales': round(last_month['sales_qty'], 2),
            'last_month_backorder': round(last_month['backorder_qty'], 2),
            'avg_demand_3m': round(features['demand_rolling_mean_3'], 2) if features['demand_rolling_mean_3'] > 0 else None,
            'same_month_last_year': round(features['demand_same_month_ly'], 2) if features['demand_same_month_ly'] > 0 else None
        }
    }


def predict_batch(predictions_list: list) -> pd.DataFrame:
    """
    Predict demand for multiple product-location-month combinations.
    
    Args:
        predictions_list: List of dicts with keys: product_id, location_id, target_month
    
    Returns:
        DataFrame with predictions
    """
    model, encoders, history = load_model()
    
    results = []
    for item in predictions_list:
        result = predict_single(
            product_id=item['product_id'],
            location_id=item['location_id'],
            target_month=item['target_month'],
            model=model,
            encoders=encoders,
            history=history
        )
        results.append(result)
    
    return pd.DataFrame(results)


# ============================================================
# PREDICT ALL
# ============================================================

def predict_all_for_month(target_month: str, output_file: str = None) -> pd.DataFrame:
    """
    Predict demand for ALL products in ALL locations for a specific month.
    
    Args:
        target_month: Month to predict (e.g., "2025-12")
        output_file: Optional CSV file to save results
    
    Returns:
        DataFrame with all predictions
    """
    print("\n" + "="*60)
    print(f"🎯 PREDICTING ALL PRODUCTS FOR {target_month}")
    print("="*60)
    
    # Load model and artifacts
    model, encoders, history = load_model()
    
    # Get all unique product-location combinations from history
    combinations = history[['product_id', 'location_id']].drop_duplicates()
    
    print(f"\n📦 Products: {combinations['product_id'].nunique()}")
    print(f"🏭 Locations: {combinations['location_id'].nunique()}")
    print(f"📊 Total combinations: {len(combinations):,}")
    print("\n⏳ Generating predictions...")
    
    results = []
    errors = []
    
    for idx, row in combinations.iterrows():
        product_id = row['product_id']
        location_id = str(row['location_id'])
        
        result = predict_single(
            product_id=product_id,
            location_id=location_id,
            target_month=target_month,
            model=model,
            encoders=encoders,
            history=history
        )
        
        if 'error' in result:
            errors.append({
                'product_id': product_id,
                'location_id': location_id,
                'error': result['error']
            })
        else:
            results.append({
                'product_id': result['product_id'],
                'location_id': result['location_id'],
                'month': result['target_month'],
                'predicted_demand_qty': result['predicted_demand_qty'],
                'last_month_demand': result['context']['last_month_demand'],
                'last_month_sales': result['context']['last_month_sales'],
                'last_month_backorder': result['context']['last_month_backorder'],
                'avg_demand_3m': result['context']['avg_demand_3m'],
                'same_month_last_year': result['context']['same_month_last_year']
            })
    
    results_df = pd.DataFrame(results)
    
    # Summary
    print(f"\n✅ Predictions generated: {len(results):,}")
    if errors:
        print(f"⚠️  Errors (not enough history): {len(errors)}")
    
    # Aggregated stats
    total_predicted = results_df['predicted_demand_qty'].sum()
    total_last_month = results_df['last_month_demand'].sum()
    total_last_sales = results_df['last_month_sales'].sum()
    
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    print(f"\n   Total predicted demand for {target_month}:")
    print(f"   📈 {total_predicted:,.0f} units")
    print(f"\n   Comparison with last month:")
    print(f"   📦 Last month demand: {total_last_month:,.0f} units")
    print(f"   🛒 Last month sales:  {total_last_sales:,.0f} units")
    print(f"   📊 Change vs demand:  {((total_predicted - total_last_month) / total_last_month * 100):+.1f}%")
    
    # Top 10 predictions
    print("\n" + "="*60)
    print("🔝 TOP 10 HIGHEST PREDICTED DEMAND")
    print("="*60)
    top10 = results_df.nlargest(10, 'predicted_demand_qty')[
        ['product_id', 'location_id', 'predicted_demand_qty', 'last_month_demand']
    ]
    print(f"\n{top10.to_string(index=False)}")
    
    # Save to CSV if requested
    if output_file:
        results_df.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to {output_file}")
    
    print("\n" + "="*60)
    
    return results_df


# ============================================================
# CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Demand Prediction Tool')
    parser.add_argument('--train', action='store_true', help='Train and save the model')
    parser.add_argument('--predict', action='store_true', help='Make a prediction')
    parser.add_argument('--all', action='store_true', help='Predict ALL products for ALL locations')
    parser.add_argument('--product', type=str, help='Product ID for prediction')
    parser.add_argument('--location', type=str, help='Location ID for prediction')
    parser.add_argument('--month', type=str, help='Target month (YYYY-MM)')
    parser.add_argument('--output', type=str, help='Output CSV file for --all predictions')
    parser.add_argument('--list-products', action='store_true', help='List available products')
    parser.add_argument('--list-locations', action='store_true', help='List available locations')
    
    args = parser.parse_args()
    
    if args.train:
        train_and_save_model()
    
    elif args.all:
        if not args.month:
            print("❌ Error: --all requires --month")
            print("\nExample:")
            print('  python predict_demand.py --all --month "2025-12"')
            print('  python predict_demand.py --all --month "2025-12" --output predictions_dec.csv')
            return
        
        output_file = args.output or f"predictions_{args.month.replace('-', '_')}.csv"
        predict_all_for_month(args.month, output_file)
    
    elif args.list_products or args.list_locations:
        _, encoders, _ = load_model()
        if args.list_products:
            print("\n📦 Available Products:")
            for p in sorted(encoders['product_id'].classes_):
                print(f"   {p}")
        if args.list_locations:
            print("\n🏭 Available Locations:")
            for l in sorted(encoders['location_id'].classes_):
                print(f"   {l}")
    
    elif args.predict:
        if not all([args.product, args.location, args.month]):
            print("❌ Error: --predict requires --product, --location, and --month")
            print("\nExample:")
            print('  python predict_demand.py --predict --product "106-DOC" --location "01" --month "2025-12"')
            return
        
        result = predict_single(args.product, args.location, args.month)
        
        if 'error' in result:
            print(f"\n❌ Error: {result['error']}")
            if 'available_products' in result:
                print(f"   Available products: {result['available_products']}")
            if 'available_locations' in result:
                print(f"   Available locations: {result['available_locations']}")
        else:
            print("\n" + "="*60)
            print("🎯 DEMAND PREDICTION")
            print("="*60)
            print(f"\n   Product:     {result['product_id']}")
            print(f"   Location:    {result['location_id']}")
            print(f"   Month:       {result['target_month']}")
            print(f"\n   📈 PREDICTED DEMAND: {result['predicted_demand_qty']:,.2f} units")
            print("\n   📊 Context:")
            ctx = result['context']
            print(f"      Last month ({ctx['last_month']}):")
            print(f"         Demand:    {ctx['last_month_demand']:,.2f}")
            print(f"         Sales:     {ctx['last_month_sales']:,.2f}")
            print(f"         Backorder: {ctx['last_month_backorder']:,.2f}")
            if ctx['avg_demand_3m']:
                print(f"      Avg demand (3m): {ctx['avg_demand_3m']:,.2f}")
            if ctx['same_month_last_year']:
                print(f"      Same month last year: {ctx['same_month_last_year']:,.2f}")
            print("="*60)
    
    else:
        parser.print_help()
        print("\n📖 Examples:")
        print("  # Train the model first")
        print("  python predict_demand.py --train")
        print("")
        print("  # Predict demand for a single product")
        print('  python predict_demand.py --predict --product "106-DOC" --location "01" --month "2025-12"')
        print("")
        print("  # Predict ALL products for ALL locations for a month")
        print('  python predict_demand.py --all --month "2025-12"')
        print('  python predict_demand.py --all --month "2025-12" --output my_forecast.csv')
        print("")
        print("  # List available products/locations")
        print("  python predict_demand.py --list-products")
        print("  python predict_demand.py --list-locations")


if __name__ == "__main__":
    main()

