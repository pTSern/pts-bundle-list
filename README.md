# `pts-bundle-list` - Asset Bundle Catalog & UI Navigation Framework

> **Author**: pTSern  
> **Version**: `1.0.0`  
> **Cocos Creator Compatibility**: `>= 3.8.0`  
> **Category**: Asset Bundle Management & UI Navigation

---

## 1. Overview

`pts-bundle-list` streamlines multi-bundle architecture in Cocos Creator. It automatically scans project asset bundles, generates strongly-typed lookup tables (`bundle_list.d.ts`), and provides high-performance runtime managers (`Bundle_Manager`) and UI navigation controllers (`UI_Controller`, `UI_Base`, `Btn_Opener`) that load and present views asynchronously without hardcoding asset paths.

---

## 2. Process Architecture & Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 Editor Panel & Main Process                 │
│                                                             │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │ Bundle List Panel    │         │ AssetDB Bundle Watch │  │
│  │ (source/panel.ts)    │         │ (source/main.ts)     │  │
│  └──────────┬───────────┘         └──────────┬───────────┘  │
│             │                                │              │
│             ▼                                ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Generates `assets/_$plugins/bundle_list.js` & .d.ts   │  │
│  │ (Prefabs, Images, JSON catalog by bundle)             │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Runtime Pipeline                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Bundle_Manager (Static Cache & Promise Pool)          │  │
│  │ - Loads bundle if not cached                          │  │
│  │ - Deduplicates concurrent load requests               │  │
│  └──────────┬───────────────────────────────┬────────────┘  │
│             │                               │               │
│             ▼                               ▼               │
│  ┌──────────────────────┐       ┌────────────────────────┐  │
│  │ UI_Controller        │       │ Btn_Opener             │  │
│  │ - UI Stack Management│       │ - Declarative Button   │  │
│  │ - Z-Index & Transitions      │ - Opens bundle view    │  │
│  │ - UI_Base instances  │       │   without custom code  │  │
│  └──────────────────────┘       └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Features & Subsystems

### 3.1. Automated Bundle Indexing (`source/main.ts`)
* Monitors AssetDB for changes in bundle folders.
* Filters assets by type:
  * `is_listing_prefabs`: Catalogs UI views and entity prefabs.
  * `is_listing_imgs`: Catalogs SpriteFrames and textures.
  * `is_listing_json`: Catalogs data configuration files.
* Automatically writes TypeScript typings to `assets/_$plugins/bundle_list.d.ts`:
  ```typescript
  namespace pTS.bundle {
      export enum EBundle {
          LOBBY = "lobby",
          BATTLE = "battle",
          SHOP = "shop"
      }
      export namespace shop {
          export enum EPrefabs {
              SHOP_VIEW = "ShopView",
              ITEM_ROW = "ItemRow"
          }
      }
  }
  ```

---

### 3.2. Asynchronous Bundle Manager (`Bundle.Manager.ts`)
* Wraps `cc.assetManager.loadBundle`.
* **Promise Caching**: Prevents duplicate bundle load calls if multiple entities or UI requests trigger simultaneously.
* Static registry (`Bundle_Manager.generator`) allows fast lookups by bundle name.

---

### 3.3. UI Controller & Stack Management (`assets/scripts/Components/UI/`)

* **`UI_Controller` (`UI.Controller.ts`)**:
  * Inherits from `Event_Driver` (`pts-core`).
  * Manages active UI hierarchy: modals, overlays, full-screen pages.
  * Loads prefabs dynamically from their parent bundle on demand.
  * Handles open/close animations, transitions, and z-index ordering.
* **`UI_Base` (`UI.Base.ts`)**:
  * Base class for bundle-loaded UI views.
  * Exposes typed lifecycle hooks: `onOpen(options)`, `onClose()`, and `onFocus()`.
* **`Btn_Opener` (`Btn.Opener.ts`)**:
  * Component attached to buttons.
  * In the Inspector, select the target bundle and view from dropdowns.
  * Clicking the button automatically loads the bundle and opens the view via `UI_Controller` — **zero code required**!

---

## 4. Editor Panel & Commands

* Open via **Extension -> pTS Bundle List -> Open Panel**.
* **Commands**:
  * **Force Generate**: Manually re-scans all bundles and updates plugin catalog files.
  * **Configuration**: Select which asset types to index (`prefabs`, `textures`, `json`).

---

## 5. Integration with `pts-core`

* Inherits from `Event_Driver` for UI lifecycle events.
* Uses `CC_EnumList` and `CC_IEnumable` for inspector dropdown reflection.
* Integrates with `pts-core/scripts/pooler/Pooler.Node` for pooling recycled popup views.
