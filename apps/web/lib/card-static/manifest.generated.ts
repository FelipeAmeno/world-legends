/**
 * lib/card-static/manifest.generated.ts
 *
 * GERADO AUTOMATICAMENTE por scripts/cards/generate-card-manifest.mts —
 * não editar à mão. Reflete o que existe em public/assets/cards/generated/
 * no momento em que `pnpm cards:manifest` (ou `cards:build`) rodou por
 * último.
 *
 * Total de presets: 2
 */

export const CARD_STATIC_MANIFEST = [
  {
    "id": "goat-validation-001",
    "rarity": "goat",
    "sourceType": "layered",
    "hudLayout": null,
    "frame": null,
    "generated": {
      "compact": {
        "src": "/assets/cards/generated/compact/goat-validation-001.webp",
        "sizeKB": 54
      },
      "standard": {
        "src": "/assets/cards/generated/standard/goat-validation-001.webp",
        "sizeKB": 113
      },
      "showcase": {
        "src": "/assets/cards/generated/showcase/goat-validation-001.webp",
        "sizeKB": 159
      }
    }
  },
  {
    "id": "wl-goat-brazil-001",
    "rarity": "goat",
    "sourceType": "full-card-artwork",
    "hudLayout": {
      "overall": {
        "x": 17,
        "y": 19,
        "width": 18,
        "height": 12
      },
      "position": {
        "x": 17,
        "y": 30,
        "width": 18,
        "height": 5
      },
      "name": {
        "x": 50,
        "y": 69,
        "width": 72,
        "height": 7
      },
      "statsTop": {
        "x": 50,
        "y": 78,
        "width": 72,
        "height": 7
      },
      "statsBottom": {
        "x": 50,
        "y": 86,
        "width": 72,
        "height": 8
      }
    },
    "generated": {
      "compact": {
        "src": "/assets/cards/generated/compact/wl-goat-brazil-001.webp",
        "sizeKB": 81
      },
      "standard": {
        "src": "/assets/cards/generated/standard/wl-goat-brazil-001.webp",
        "sizeKB": 265
      },
      "showcase": {
        "src": "/assets/cards/generated/showcase/wl-goat-brazil-001.webp",
        "sizeKB": 420
      }
    }
  }
] as const;
