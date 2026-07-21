# asanAI - Project Reference

No-code, offline-first machine learning toolkit running entirely in the browser with TensorFlow.js. Visual GUI for designing, training, and evaluating neural networks without writing code.

- **Paper:** https://arxiv.org/abs/2501.06226
- **Author:** Norman Koch (norman.koch@tu-dresden.de)
- **Institution:** ScaDS.AI, TU Dresden / University of Leipzig
- **License:** MIT

---

## Architecture Overview

- **Frontend:** JavaScript (browser), HTML, CSS
- **Backend:** PHP (serving, data management, HPC integration)
- **ML Engine:** TensorFlow.js (CPU, WebGL, WASM backends)
- **Visualization:** Plotly.js, custom Canvas/SVG renderers
- **Libraries:** MathJax, Temml, Prism.js, Pyodide, jszip, SweetAlert2, jstat, Atrament.js

Main class is `asanAI` in `asanai.js`. Heavy use of global variables + jQuery DOM manipulation. Multi-language (EN/DE), theme system (light/dark/natural). PWA support. Docker deployment.

---

## Entry Points

| File | Purpose |
|---|---|
| `index.php` | Main entry point. Sets COOP/COEP headers for SharedArrayBuffer (TF.js WASM), includes all JS/CSS/PHP, generates page structure |
| `initializing.php` | Page initialization logic, loads datasets, sets up GUI |
| `cosmo/index.php` | COSMO teaching mode redirect -> `cosmo_ok/index.php?start_cosmo=1` |
| `manifest.json` | PWA manifest with camera permission |

---

## PHP Files (Root)

| File | Purpose |
|---|---|
| `functions.php` | Helper functions: `getUserId()`, `ssh_taurus()`, `get_number_model_names()`, markdown parsing |
| `translations.php` | All EN/DE UI translations |
| `navbar.php` | Navigation bar HTML template |
| `stats.php` | Usage statistics tracking |
| `error.php` | Custom error page |

---

## PHP Template Fragments (`php_files/`)

| File | Purpose |
|---|---|
| `ribbon.php` | Full ribbon UI (564 lines): dataset/model selector, loss/metric config, hyperparameters, image options, training button, settings tab, augmentation tab, visualization settings, log tab, imprint tab, language switcher |
| `optimizer.php` | Dynamic optimizer config: Adam, Adadelta, Adagrad, Adamax, RMSprop, SGD with all parameters |
| `load_msg.php` | Loading screen with theme-aware logo and spinner |
| `log_users.php` | Visitor/referrer logging to `/var/log/` |
| `status_bar.php` | Status bar: model status, data loading progress, training progress, memory debugger |
| `sources_popup.php` | Parses README.md for sources/credits |
| `get_number_of_model_names.php` | JSON API: count of saved model names |
| `current_status.php` | Checks HPC training status via SSH to Taurus cluster |
| `errorcontainer.php` | Error display container |
| `upload_model_dialog.php` | Upload dialog for model.json, labels.json, weights.json, custom_images.zip |
| `save_model_dialog.php` | Download/save dialog with optional database save |
| `traindata.php` | Scans `traindata/` for JSON configs, returns available datasets |
| `losses_popup.php` | Loss function explanation popup |

---

## Tab Templates (`tabs/`)

| File | Purpose |
|---|---|
| `code.php` | Code export: Python, Python Expert, HTML (Prism-highlighted), Pyodide in-browser editor |
| `data.php` | Training data display: image grid, XY scatter plot, download progress |
| `predict.php` | Prediction: Grad-CAM, webcam, canvas drawing, file upload, drag-and-drop, HTML output |
| `training.php` | Training controls, history tabs, Plotly epoch chart, loss landscape, confusion matrix |
| `summary.php` | Model summary container |
| `visualizations.php` | Rich sub-tabs: network viz, math mode, feature maps, weight surfaces, health status, dimensionality river, activation atlas, gradient flow, TDA, weight analysis, layer I/O, loss landscape, neural organism |
| `presentation.php` | German presentation slides with embedded math |
| `own_csv.php` | CSV upload with auto-adjust, auto-loss, separator config |
| `own_images.php` | Webcam capture, ZIP upload/download, custom categories |
| `own_tensor.php` | Tensor file upload (X/Y) with Python code example |

---

## Core JavaScript Files (Root)

### Main Application

| File | Purpose |
|---|---|
| `asanai.js` | Main `asanAI` class - central orchestrator for model creation, layers, training, predictions, GUI state |
| `main.js` | Core initialization, page setup |
| `variables.js` | All global variable declarations (shared state between files) |
| `model.js` | Model creation/disposal, architecture management |
| `train.js` | Core training logic |
| `predict.js` | Core prediction logic |
| `updated_page.js` | Orchestrates page updates after model changes |
| `debug.js` | Debug logging system |
| `safety.js` | Assert/validate utility functions |
| `validation.js` | Input validation utilities |

### Data Pipeline

| File | Purpose |
|---|---|
| `data.js` | Core data processing, normalization, tensor creation |
| `csv.js` | CSV parsing, X/y data extraction, normalization |
| `custom_images.js` | Custom image upload, webcam capture, data management |
| `data_origin.js` | Data source switching (default/custom/tensor/image/csv) |
| `input_shape.js` | Input shape detection and management |
| `labels.js` | Label management (class names) |
| `valsplitwatcher.js` | Guards validation split from being too high for dataset size |

### Custom TF.js Layers

| File | Purpose |
|---|---|
| `debug_layer.js` | `DebugLayer` for inspecting intermediate layer outputs |
| `snake_activation_layer.js` | Snake activation: `x + sin^2(x)/alpha` (periodic activation function) |
| `multi_activation.js` | `MultiActivation` weighted combination of multiple activation functions |
| `embedding.js` | Custom Embedding layer for text/integer data |
| `skip_connection.js` | Skip connection management for ResNet-like architectures |

### Visualization

| File | Purpose |
|---|---|
| `fcnn.js` | Canvas-based fully connected neural network visualization |
| `fcnn_editable.js` | Interactive FCNN editing (drag nodes, edit connections) |
| `faster_canvas_functions.js` | Path2D batching for FCNN canvas performance |
| `feature_maps.js` | Feature map visualization: color decorrelation, FFT, DeepDream |
| `activation_atlas.js` | Gradient-ascent activation atlas (max-activated inputs per neuron) |
| `activation_atlas_tab.js` | Activation atlas tab management |
| `grad_cam.js` | Grad-CAM visualization with colormap |
| `weight_surfaces.js` | 3D weight matrix surface visualization |
| `dimensionality_river.js` | t-SNE per-layer dimensionality visualization |
| `gradient_flow_heatmap.js` | Gradient magnitude heatmap across layers |
| `loss_landscape.js` | 2D loss landscape visualization |
| `trace_through_loss_landscape.js` | Singleton 3D loss landscape plotter with optimizer trajectory |
| `neural_organism.js` | Live training "organism" animation (bio-inspired) |
| `summary.js` | Model summary with parameter counts and sparklines |
| `plot_predict.js` | Plotly prediction surface/contour visualization |
| `explain.js` | Neuron activation visualization (max-activated patterns) |
| `explain_losses.js` | Loss component visualization |

### Health/Diagnosis

| File | Purpose |
|---|---|
| `health_status.js` | Records layer I/O statistics during training, health dashboard data |
| `health_status_popups.js` | Weight analysis indicator tooltips |
| `weight_analysis.js` | Comprehensive weight analysis (1,495 lines): entropy, sparsity, SVD steepness, kurtosis, KS-test, inter-filter correlation, dead neuron detection, weight drift, complexity analysis. Determines if a model has been trained |

### UI Components

| File | Purpose |
|---|---|
| `gui.js` | UI utility functions |
| `layers_gui.js` | Layer options HTML builder |
| `layer_descriptions.js` | Human-readable descriptions of layer types |
| `layer_grouping.js` | Groups layers for visualization |
| `popups.js` | Popup open/close management |
| `overlay.js` | Modal overlay with progress bars |
| `theme.js` | Theme switching (light/dark/natural) |
| `translations.js` | Runtime language switching (EN/DE) |
| `bottom.js` | Bottom UI elements |
| `toc.js` | Table of contents generation |

### Training Utilities

| File | Purpose |
|---|---|
| `optimizer.js` | Optimizer parameter configuration UI |
| `loss_metric.js` | Loss/metric helper functions |
| `initializers.js` | Weight initializer configuration |

### Data & Export

| File | Purpose |
|---|---|
| `clipboard_and_download.js` | Clipboard, download, ZIP export |
| `cookies_and_url.js` | Cookie persistence and URL parameter handling |
| `config_loader.js` | Configuration loading from URL/cookies |
| `python_code.js` | Export model as standalone Python script |

### Drawing/Input

| File | Purpose |
|---|---|
| `drawing.js` | Atrament.js freehand drawing overlay for predictions |
| `segmentation.js` | Drawing overlay layers for image segmentation |
| `webcam.js` | Webcam access and streaming |

### Math/Documentation

| File | Purpose |
|---|---|
| `math_mode.js` | LaTeX/TEMML rendering for math formulas |
| `math_editable.js` | Editable math variables in formulas |
| `my_temml.js` | Custom Temml integration |
| `manual.js` | Documentation TOC builder |
| `layer_descriptions.js` | Human-readable layer descriptions |

### Other

| File | Purpose |
|---|---|
| `easter_eggs.js` | Confetti/fireworks animations |
| `selftests.js` | In-browser self-test framework |
| `tests.js` | Test runner interface |
| `online_python.js` | Pyodide (in-browser Python) integration |
| `online_python_code_completion.js` | Code completion for Pyodide editor |
| `base_wrappers.js` | TF.js tensor utilities, memory management wrappers |

---

## CSS Files (`css/`)

| File | Purpose |
|---|---|
| `style.css` | Main design system (~2,200 lines): CSS custom properties, glassmorphism, ribbon, FCNN canvas, math popup, hybrid formulas |
| `darkmode.css` | Dark starry gradient background, dark glass boxes |
| `lightmode.css` | Light blue gradient background, white glass boxes |
| `naturalmode.css` | Whitesmoke background, green-tinted glass boxes |
| `ribbon.css` | Base ribbon UI (gradient tabs, min-width 1150px) |
| `new_ribbon.css` | Updated ribbon (Segoe UI, fixed 135px height, backdrop blur) |
| `ribbon-dark.css` | Dark theme ribbon |
| `ribbondarkmode.css` | Dark ribbon group title/separator colors |
| `ribbonlightmode.css` | Light ribbon group title/separator colors |
| `ribbonnaturalmode.css` | Natural ribbon group title/separator colors |
| `ribbon_media.css` | Responsive: hides ribbon on mobile, shows symbol buttons |
| `code_tab.css` | Pyodide code editor theme (dark + light) |
| `auto_animations.css` | Universal transitions (0.2s ease), hover scale, spring |
| `auto_complete.css` | Autocomplete popup styles |
| `presentation.css` | Fixed fullscreen presentation mode |
| `cosmo.css` | COSMO teaching mode overrides (larger fonts, simplified) |
| `soft_button.css` | Legacy gradient buttons |
| `loss_landscape.css` | Standalone 3D loss landscape CSS (dark theme) |

---

## Visualizer Modules (`visualizer/`)

Each is self-contained with encapsulated CSS and a JS class:

| File | Purpose |
|---|---|
| `convolution_visualizer.js` | Grid-based convolution with animated filter scanning |
| `dense_visualizer.js` | SVG dense layer: input -> weights -> neurons -> output |
| `flatten_visualizer.js` | 2D matrix -> 1D vector with flying cell animations |
| `activation_visualizer.js` | Plotly graph of activation functions with live tracing |
| `pooling_visualizer.js` | Max/average pooling with animated filter sliding |
| `reshape_visualizer.js` | Tensor reshape with moving cells and color coding |
| `conv_transpose_visualizer.js` | Transposed convolution with stamp-based upsampling |
| `depthwise_conv_visualizer.js` | Independent per-channel kernel visualization |
| `layer_normalization_visualizer.js` | Animated scan + mean/std/normalize |
| `dropout_visualizer.js` | Sequential masking highlighting |
| `gaussian_noise_visualizer.js` | Input + noise = output visualization |
| `separable_conv_visualizer.js` | Two-step: depthwise spatial + pointwise cross-channel |
| `upsampling_visualizer.js` | Nearest-neighbor upsampling with scan |

---

## Standalone HTML Pages

| File | Purpose |
|---|---|
| `manual.html` | Comprehensive handbook (3,042 lines) with interactive demos and lightbox |
| `loss_landscape.html` | Standalone 3D loss landscape visualizer with Plotly + MathJax |
| `class_test.html` | Standalone FCNN canvas visualization test page |
| `test.html` | Sinus approximation demo (training vs. extrapolation behavior) |
| `links.html` | Internal IP link |

---

## Test Infrastructure (`tests/`)

| File | Purpose |
|---|---|
| `smoke_tests` | Orchestrator: runs all `find_*` scripts |
| `all_js_files_are_use_strict` | Verifies every JS file starts with `'use strict';` |
| `find_unused_variables` | Checks `var` declarations in `variables.js` are used elsewhere |
| `find_deep_nested` | Detects JS functions with >5 brace nesting levels |
| `find_long_functions` | Finds functions exceeding length threshold |
| `find_double_defined_functions` | Finds duplicate function names across JS files |
| `find_uncalled_functions` | Finds defined but never called functions (dead code) |
| `find_unawaited_functions` | Finds async functions called without `await` |
| `find_missing_translations` | Verifies JS translation keys exist in PHP translations |
| `find_unwrapped_base_functions` | Checks TF.js API methods used directly without wrappers |
| `find_missing_func_params` | Finds functions with missing parameters |
| `fake.y4m` | Fake video file for webcam testing |

---

## HPC Integration (`taurus/`)

| File | Purpose |
|---|---|
| `runme.sh` | SLURM batch script: loads TF 2.6.0+CUDA, creates venv, runs training/prediction |
| `network.py` | Loads `model_data.json`, converts to Keras, trains with `model.fit()` |
| `predict.py` | Loads saved Keras model, prints summary |
| `.example_data.json` | Sample model_data.json (Sequential Dense network) |

---

## Presentation System (`presentation/`)

| File | Purpose |
|---|---|
| `index.php` | PHP slide deck generator (402 lines): structured data array -> HTML slides with ScaDS.AI/TU Dresden branding, keyboard navigation, MathJax |

---

## CI/CD (`.github/workflows/`)

| File | Purpose |
|---|---|
| `main.yml` | CI pipeline: smoke tests -> Playwright on Ubuntu 22.04/24.04, auto-tags on success |
| `blog_php_validator.yml` | Blog PHP/JS validation |

---

## Asset Directories

| Directory | Purpose |
|---|---|
| `_gui/` | SVG icons for toolbar (brush, color, download, etc.), logos, favicons, promotional images |
| `icons/` | Editor toolbar icons in 3 states: `normal/`, `hot/`, `disabled/` (18 PNGs each) |
| `images/` | jQuery UI theme images, small/large icons |
| `lang/` | Flag icons (DE/EN), traffic sign network diagrams, emergency stop images |
| `screens/` | Application screenshots (8 PNGs) |
| `manual/` | Tutorial assets: presentation, videos, ~50 screenshots |
| `documentation/` | Documentation images (18 GIFs/PNGs) |
| `poster/` | Project poster (ODP + PNG) |
| `traindata/` | Training data: JSON configs, XOR dataset, 1,103 traffic sign images |
| `class_test_images/` | Test images for classification (apple, banana, orange - 288 files) |
| `libs/` | Vendored third-party libraries (3,067 files): jQuery, Plotly, MathJax, Temml, SweetAlert2, Pyodide, etc. |

---

## Deployment

| File | Purpose |
|---|---|
| `Dockerfile` | PHP+Apache container setup |
| `docker-compose.yml` | Docker Compose configuration |
| `docker.sh` | Docker helper script |
| `install.sh` | Installation script |
| `.env` | Environment configuration |
| `.dockerignore` | Docker ignore rules |
| `.htaccess` | Apache rules (hide dev files, custom error pages) |
| `.eslintrc.js` | ESLint config with extensive global declarations |

---

## COSMO Teaching Mode (`cosmo_ok/`)

Complete variant of the application (4,504 files) designed for teaching. Simplified UI with `cosmo.css` overrides. Three.js-based 3D visualizations (FCNN, AlexNet, LeNet). Additional PHP for user management (admin, registration, network deletion, logging). Model sharing capabilities. Own Docker setup.

---

## Key Patterns

1. **Global variables** - All shared state lives in `variables.js`, accessed by name across all JS files
2. **jQuery DOM manipulation** - UI updates via jQuery selectors, no framework
3. **Custom TF.js layers** - Snake, MultiActivation, Embedding, DebugLayer extend TF.js
4. **Self-contained visualizers** - Each visualizer in `visualizer/` has its own CSS functions and JS class
5. **PHP + JS split** - PHP handles serving/templates/translations, JS handles all ML and UI logic
6. **Wrapper pattern** - TF.js API calls should go through `base_wrappers.js` wrappers (enforced by tests)
7. **Theme system** - CSS files swap via `theme.js`, using custom properties in `style.css`
