# Proofer CEP Extension

## Overview

Proofer is an Adobe Illustrator extension that automates the creation of label proof templates. It makes templates with user-defined label dimensions, shapes, spot colors, visual legends, and other attributes necessary for proofing labels and producing them.

## Development Context

### Best Practices
- **Single source of truth**: All production constants live in `proofer.jsx`
- **ES3 compatibility**: ExtendScript requires ES3 syntax (no arrow functions, const/let)
- **Non-destructive**: Operations preserve user artwork unless explicitly required
- **Type safety**: TypeScript interfaces bridge CEP and ExtendScript layers

### Requirements
- Adobe Illustrator CC 2018+ (v17.0+)
- Node.js 18+
- The `Proofer Actions` folder set
  - An `Add Arrows` action folder set for arrowhead functions

## Project Structure

```
proofer/
├── assets/                   # Static assets
│   ├── icons/               # Extension icons
│   └── legends/             # Template artwork files
├── src/
│   ├── js/                    # CEP Panel (React/TypeScript)
│   │   ├── main/             # Main panel UI  
│   │   │   ├── index.html    # Panel entry point
│   │   │   ├── index-react.tsx
│   │   │   ├── App.tsx       # Main React component
│   │   │   └── App.scss      # Panel styles
│   │   └── lib/              # CEP utilities
│   ├── jsx/                  # ExtendScript (ES3)
│   │   ├── proofer.jsx     # Core proof generation logic
│   │   ├── illustrator.ts    # TypeScript interface
│   │   ├── utils/           # Shared utilities
│   │   └── index.ts         # JSX entry point
│   └── shared/              # Shared types
├── config/                  # Configuration files
│   ├── tsconfig-build.json  # Build TypeScript config
│   ├── vite.es.config.ts    # ExtendScript build config
│   └── .prettierrc         # Code formatting rules
├── docs/                   # Documentation
│   └── proofer-guide.md # Complete development guide
├── cep.config.ts           # CEP configuration
└── vite.config.ts          # Main build configuration
```

## Primary Development Files

Most development time will be spent in these key areas:

1. **`src/js/main/App.tsx`** - Main React component with UI logic and state management
2. **`src/js/main/App.scss`** - Panel styling and theme integration  
3. **`src/jsx/proofer.jsx`** - Core proof generation logic (ExtendScript)
4. **`src/jsx/illustrator.ts`** - TypeScript interface bridging CEP and ExtendScript
5. **`assets/legends/`** - Template artwork files for adding new material variants

## How It Works

### 1. User Interface (React)
The panel provides two modes:
- **Make**: Create new proof templates with specified dimensions
- **Upload**: Use existing die-line files as templates

The UI enforces business rules:
- Sheets labels disable material/white ink options
- Die-cut/Custom labels require guidelines
- White ink selections force guideline creation

### 2. ExtendScript Processing
When the user clicks OK, the configuration is passed to ExtendScript which:

1. **Creates Document**: Sets up CMYK document with proper dimensions
2. **Generates Shapes**: Creates label shapes (squared, rounded, or round)
3. **Applies Offsets**: Runs Illustrator actions to create bleed/safe zones
4. **Adds Spot Colors**: Creates print-specific spot colors
5. **Creates Dimensions**: Adds measurement lines with arrows
6. **Places Legends**: Adds visual reference artwork
7. **Organizes Layers**: Structures artwork for production

### 3. Key Components

**Spot Colors**:
- `Dieline` (Magenta): Cut path
- `BleedLine` (Cyan): Bleed boundary
- `White Backer`: White ink layer

**Layer Structure**:
- `Guides`: Locked reference layer
- `Artwork`: User content layer

**Dimension System**:
- Dynamic sizing based on label dimensions
- Automated arrow placement via actions
- Configurable offsets per label type

## Extending the Extension

### Add New Label Type
1. Update `LABEL_TYPE_CONFIG` in `proofer.jsx`
2. Add corresponding action in Illustrator
3. Update dimension offset table
4. Add UI option in `App.tsx`

### Add New Legend
1. Create `.ai` file following naming convention
2. Place in `assets/legends/` folder
3. Update legend mapping logic if needed

## Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build extension
npm run build

# Package as ZXP
npm run zxp

# Create distribution ZIP
npm run zip
```

## Debugging

- Enable PlayerDebugMode for development
- Check CEP logs: `~/Library/Logs/CSXS/CEP*.log` (Mac) or `%TEMP%/CEP*.log` (Windows)
- Use Chrome DevTools at `http://localhost:8860` (port from cep.config.ts) 