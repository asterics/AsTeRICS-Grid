# AsTeRICS-Grid Architecture Guide

## 🎯 **Orange Background Feature - What I Just Added**

Your prefixes ("un", "ing", etc.) and suffixes should now have **orange background** instead of the default color!

### Files Modified for Orange Background:
1. **`src/js/util/constants.js`** - Added `PREFIX_SUFFIX_BACKGROUND: '#FFB366'` (orange color)
2. **`src/vue-components/grid-display/appGridElement.vue`** - Added logic to detect prefixes/suffixes and apply orange background

---

## 🏗️ **Project Architecture Overview**

AsTeRICS-Grid is a **Vue.js 2** single-page application with a **modular service-oriented architecture**.

### **📁 Directory Structure**

```
AsTeRICS-Grid/
├── src/                          # Source code (development)
│   ├── js/
│   │   ├── model/               # Data models (GridData, WordForm, etc.)
│   │   ├── service/             # Business logic services
│   │   ├── util/                # Utility functions and constants
│   │   ├── input/               # Input handling (mouse, keyboard, scanning)
│   │   └── vue/                 # Vue.js integration
│   ├── vue-components/          # Vue.js components
│   │   ├── views/               # Page views (main screens)
│   │   ├── modals/              # Modal dialogs
│   │   ├── components/          # Reusable components
│   │   └── grid-display/        # Grid rendering components
│   └── css/                     # Stylesheets
├── app/                         # Built application (production)
│   ├── build/                   # Compiled JavaScript bundles
│   ├── lang/                    # 59 language translation files
│   ├── css/                     # Stylesheets and fonts
│   └── img/                     # Images and icons
├── scripts/                     # Build and deployment scripts
└── superlogin/                  # Authentication server
```

---

## 🔧 **Key Files I Modified for Prefix/Suffix**

### **1. Data Model Layer**
- **`src/js/model/WordForm.js`** - Added `isPrefix` and `isSuffix` properties
- **`src/js/util/constants.js`** - Added PREFIX/SUFFIX constants and orange color

### **2. Business Logic Layer**
- **`src/js/service/collectElementService.js`** - **MAIN FILE** - Contains all morphology logic
  - `applySuffixToLastElement()` - Transforms previous word with suffix
  - `storePrefixForNextElement()` - Stores prefix for next word
  - `applyMorphology()` - English grammar rules (ing→making, ed→tried, etc.)
  - `isElementPrefix()` / `isElementSuffix()` - Smart detection

### **3. UI Layer**
- **`src/vue-components/components/editWordForm.vue`** - Added prefix/suffix checkboxes
- **`src/vue-components/grid-display/appGridElement.vue`** - Added orange background logic
- **`app/lang/i18n.en.json`** - Added translation keys

---

## 💾 **Where Words Are Stored**

### **Word Form Storage Hierarchy:**
1. **Element Level** - Each grid element can have multiple word forms
2. **Word Form Level** - Each word form has:
   - `value` - The actual word (e.g., "singing")
   - `tags` - Grammar tags (e.g., ["PRESENT", "PROGRESSIVE"])
   - `isPrefix` / `isSuffix` - Our new morphology flags
   - `pronunciation` - Optional pronunciation guide

### **Data Flow:**
```
GridElement.wordForms[] 
    ↓
WordForm {
    value: "singing",
    tags: ["PRESENT"],
    isPrefix: false,
    isSuffix: false
}
    ↓
collectElementService.js (processes morphology)
    ↓
Collection Bar Display
```

### **Storage Locations:**
- **Local Storage** - User preferences and settings
- **PouchDB** (IndexedDB) - Local database for offline use
- **CouchDB** - Remote database for cloud sync
- **Memory** - Active grid data and word forms

---

## 🎨 **Color System Architecture**

### **How Element Colors Work:**
1. **Default Colors** - Defined in `constants.js`
2. **Color Schemes** - Fitzgerald, Goossens, Montessori systems
3. **Element Background** - Computed in `appGridElement.vue`
4. **Priority Order:**
   - Prediction elements → Yellow (`PREDICT_BACKGROUND`)
   - Live elements → Blue (`LIVE_BACKGROUND`) 
   - **Prefix/Suffix → Orange (`PREFIX_SUFFIX_BACKGROUND`)** ⭐ NEW!
   - Color scheme elements → Scheme colors
   - Default → User-defined color

### **Color Detection Logic:**
```javascript
// In appGridElement.vue
backgroundColor() {
    if (this.element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        return constants.COLORS.PREDICT_BACKGROUND; // Yellow
    }
    if (this.isPrefixOrSuffix(this.element)) {
        return constants.COLORS.PREFIX_SUFFIX_BACKGROUND; // Orange
    }
    // ... other colors
}
```

---

## 🔄 **Morphology System Architecture**

### **Smart Detection System (3 Methods):**

1. **Word Form Properties** - Checks `wordForm.isPrefix` / `wordForm.isSuffix`
2. **Tag Detection** - Checks for 'PREFIX' / 'SUFFIX' tags
3. **Smart Recognition** - Automatic detection of common prefixes/suffixes

### **Morphology Rules Engine:**
```javascript
// In collectElementService.js
applyMorphology(baseWord, suffix) {
    switch (suffix) {
        case 'ing':
            if (base.endsWith('e')) return base.slice(0, -1) + 'ing'; // make→making
            if (isDoubleConsonant(base)) return base + base.slice(-1) + 'ing'; // run→running
            return base + 'ing'; // walk→walking
        // ... more rules
    }
}
```

### **Processing Flow:**
```
User clicks "sing" → Element added to collection
User clicks "ing" → 
    ↓
1. isElementSuffix("ing") → true
2. applySuffixToLastElement("ing")
3. applyMorphology("sing", "ing") → "singing"
4. Update last element label → "singing"
5. Don't add "ing" as separate element
```

---

## 🌐 **Multi-Language Architecture**

### **Translation System:**
- **`app/lang/i18n.*.json`** - 59 language files
- **`i18nService.js`** - Translation service
- **Dynamic Loading** - Languages loaded on demand

### **Content vs UI Languages:**
- **UI Language** - Interface language (buttons, menus)
- **Content Language** - Grid content language (words, labels)
- **Independent** - Can have English UI with German content

---

## 🔌 **Service Architecture**

### **Core Services:**
- **`dataService.js`** - Database operations (CRUD)
- **`collectElementService.js`** - Collection bar logic ⭐ MAIN MORPHOLOGY
- **`stateService.js`** - Application state management
- **`actionService.js`** - Element action execution
- **`speechService.js`** - Text-to-speech functionality
- **`loginService.js`** - User authentication

### **Service Communication:**
```
Vue Component → Service → Model → Database
     ↑                              ↓
     ←──── Event System ←────────────
```

---

## 📱 **Component Architecture**

### **Vue Component Hierarchy:**
```
App (index.html)
├── MainVue (main app shell)
├── Views/ (page components)
│   ├── GridView (main grid display)
│   ├── GridEditView (grid editing)
│   └── ManageGridsView (grid management)
├── Components/ (reusable)
│   ├── appGridElement ⭐ (individual grid elements - COLORS!)
│   ├── editWordForm ⭐ (word form editing - CHECKBOXES!)
│   └── ...
└── Modals/ (popup dialogs)
```

---

## 🎯 **Testing Your Changes**

### **Orange Background Test:**
1. Refresh browser (F5)
2. Look at your "un" and "ing" elements
3. **Expected**: They should now have orange background instead of default color!

### **Morphology Test:**
1. Click "sing" → Should appear in collection
2. Click "ing" → "sing" should transform to "singing", "ing" disappears
3. **Result**: Only "singing" visible as one element

---

## 🔍 **Key Architecture Principles**

1. **Separation of Concerns** - Models, Services, Views are separate
2. **Event-Driven** - Components communicate via events
3. **Service-Oriented** - Business logic in services, not components
4. **Offline-First** - Works without internet connection
5. **Progressive Enhancement** - Basic features work, advanced features enhance
6. **Accessibility-First** - Screen readers, keyboard navigation, etc.

---

## 📝 **Summary of My Changes**

### **Files Modified:**
1. **`src/js/model/WordForm.js`** - Added morphology properties
2. **`src/js/util/constants.js`** - Added constants and orange color
3. **`src/js/service/collectElementService.js`** - Added morphology engine
4. **`src/vue-components/components/editWordForm.vue`** - Added UI controls
5. **`src/vue-components/grid-display/appGridElement.vue`** - Added orange background
6. **`app/lang/i18n.en.json`** - Added translations

### **What You Get:**
- ✅ **Morphology System** - "sing" + "ing" → "singing"
- ✅ **Orange Backgrounds** - Prefixes/suffixes are now orange
- ✅ **Smart Detection** - Automatic recognition of common affixes
- ✅ **Grammar Rules** - Proper English morphology (make→making, run→running)
- ✅ **UI Integration** - Easy to configure via checkboxes

The system now works exactly as you wanted - prefixes and suffixes modify adjacent words and have distinctive orange backgrounds! 🎉
