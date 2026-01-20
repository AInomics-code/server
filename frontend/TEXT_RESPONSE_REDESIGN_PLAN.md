# Text Response Structure Redesign Plan

## Current State Analysis

The current implementation uses basic markdown parsing with:
- Simple line-by-line splitting
- Basic bold text detection (`**text**`)
- Minimal spacing (16px between paragraphs)
- No number/currency highlighting
- No section title detection
- Basic list formatting

## Proposed Improvements

### 1. **Typography Hierarchy**

#### Section Titles (e.g., "Backorder analysis")
- **Size**: 13px
- **Color**: #9CA5B5 (lighter gray)
- **Weight**: 500 (medium)
- **Transform**: Uppercase
- **Letter Spacing**: 0.5px
- **Spacing**: 24px top margin, 12px bottom margin

#### Main Findings/Bold Headlines
- **Size**: 16px
- **Color**: #E6EAF1 (bright white)
- **Weight**: 600 (semi-bold)
- **Spacing**: 16px top margin, 8px bottom margin
- **Number Highlighting**: Blue (#5B9EFF) for currency/numbers

#### Regular Paragraphs
- **Size**: 15px
- **Color**: #C5CDD8 (medium gray)
- **Weight**: 400 (regular)
- **Line Height**: 1.8
- **Spacing**: 8px between paragraphs

### 2. **Bold Text & Number Highlighting**

#### Bold Text Detection
- Detect `**text**` patterns
- Style with #E6EAF1 color, 600 weight

#### Number/Currency Highlighting
- Auto-detect patterns: `$527K`, `341K`, `65%`, `$70,037,642.86`
- Highlight in blue (#5B9EFF)
- Font weight: 700 (bold)
- Size: 16px (same as surrounding text or slightly larger)

### 3. **Spacing System**

#### Paragraph Spacing
- **Between paragraphs**: 12px
- **After section titles**: 12px
- **After bold headlines**: 8px
- **Empty lines**: 16px spacing

#### List Spacing
- **Between list items**: 8px
- **Left padding**: 16px
- **Bullet style**: • (medium gray)

### 4. **List Formatting**

#### Numbered Lists (1., 2., 3.)
- **Format**: "1. **Title:**"
- **Bold titles** with regular descriptions
- **Spacing**: 12px between items
- **Indentation**: 20px

#### Bullet Lists (-, •)
- **Format**: "• Item text"
- **Spacing**: 8px between items
- **Indentation**: 16px

### 5. **Animations**

#### Staggered Fade-in
- Each paragraph: 0.4s duration
- Delay increment: 0.05s per element
- Easing: `[0.16, 1, 0.3, 1]` (smooth)

#### Section Titles
- Fade in first (delay: 0s)
- Duration: 0.4s

#### Bold Headlines
- Fade in after title (delay: 0.1s)
- Duration: 0.5s

#### Regular Text
- Fade in last (delay: 0.15s)
- Duration: 0.4s

### 6. **Special Formatting**

#### Currency/Numbers in Text
- Pattern: `$527K`, `341K (65%)`, `$70,037,642.86`
- Color: #5B9EFF
- Weight: 700
- Inline with text

#### Percentages
- Pattern: `65%`, `(65%)`
- Same blue highlighting

#### Dates/Periods
- Pattern: "January 2025", "Q4 2025"
- Regular styling, but can be slightly emphasized

## Implementation Structure

```typescript
// Enhanced markdown parser with:
1. Section title detection (uppercase, ends with "analysis", "report", etc.)
2. Bold text extraction with number highlighting
3. List formatting (numbered and bulleted)
4. Proper spacing between elements
5. Smooth animations per element
6. Typography hierarchy enforcement
```

## Visual Examples

### Section Title
```
BACKORDER ANALYSIS
```
- 13px, #9CA5B5, uppercase, 24px top margin

### Main Finding
```
Especias Libras backorders causing $527K in lost July sales
```
- 16px, #E6EAF1, $527K in blue (#5B9EFF)

### Regular Paragraph
```
Potential recovery: 341K (65%) Preventable
```
- 15px, #C5CDD8, 341K and 65% in blue

### Numbered List
```
1. **Analyze root causes of backorders:**
   • Identify the top products/SKUs...
   • Understand the reasons behind...
```
- Bold titles, bullet sub-items, proper indentation

## Color Palette

- **Section Titles**: #9CA5B5
- **Bold Headlines**: #E6EAF1
- **Regular Text**: #C5CDD8
- **Numbers/Currency**: #5B9EFF
- **Background**: #141A24

## Spacing Scale

- **Extra Large**: 24px (after section titles)
- **Large**: 16px (between major sections, empty lines)
- **Medium**: 12px (between paragraphs, list items)
- **Small**: 8px (between related items, after headlines)
