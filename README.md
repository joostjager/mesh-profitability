# Mesh inference electricity calculator

A static calculator for electricity cost per million output tokens, styled to match [meshllm.cloud](https://meshllm.cloud/). Choose an RTX 4090 desktop, RTX 5090 desktop, 64 GB M4 Max Mac, or 512 GB M3 Ultra Mac Studio, then compare all five models in a desktop table. Hardware and electricity price are the only inputs; the electricity default is **$0.20/kWh**.

The table fetches current provider prices for all models and shows each model's lowest active output-token rate per million tokens, provider, and theoretical maximum monthly profit after electricity. Rows are sorted by monthly profit descending, with unknown profits last; the order updates with hardware, electricity price, and provider quotes. Input charges are excluded, and hosted quantization can differ from the local variant. The former “Behind the number” section is omitted from the UI; calculation details and source records remain in this repository.

## Run locally

Run `npm start`, then open [http://127.0.0.1:4173](http://127.0.0.1:4173). Python 3 is required for this preview server. No dependency installation or build is needed. Serve the files over HTTP because the browser loads JavaScript modules.

Run `npm test` with Node.js 20 or newer to check the calculation and source data integrity.

## GitHub Pages

After committing and uploading the repository yourself, open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, and choose **main / (root)**. Save. The site uses relative asset paths and works under a repository subpath such as `/mesh-profitability/`. The `.nojekyll` file disables Jekyll processing. No secrets, server, or build workflow are needed.

## Calculation and scope

```text
hours per million output tokens = 1,000,000 / tokens per second / 3,600
kWh per million output tokens   = watts / 1,000 × hours
USD per million output tokens   = kWh × USD per kWh
hours per month                = 30 × 24 = 720
maximum monthly output revenue  = tokens per second × 3,600 / 1,000,000 × hosted output USD per million × 720
maximum monthly profit          = monthly output revenue − watts / 1,000 × USD per kWh × 720
```

The result covers continuous **generation only**. Prompt processing, gaps between requests, hardware purchase, external cooling, networking, and fees are excluded. A decode benchmark is not end-to-end serving throughput. The maximum-profit column assumes a fixed 30-day month (720 hours), 100% utilization and that every generated token sells at the cheapest listed OpenRouter output rate. It counts output revenue minus electricity only, excludes input revenue and charges, and preserves negative results. This is a theoretical 30-day ceiling for the listed single-request rate, not a forecast of demand or net profit; batching could change the rate.

The initial shortlist is Qwen3.8 27B, Qwen3.6 35B-A3B, and Gemma 4 31B, based on the OpenRouter popularity research from November 12, 2026. GLM-5.3 Flash and MiniMax M3 extend it to larger single-machine models. Ten pairings have curated speed benchmarks. All models remain visible; compatibility is assessed separately from benchmark availability. A compatible model without a speed benchmark has unknown energy, electricity cost, and monthly profit. Quantizations and benchmark contexts differ across profiles. Gemma's Mac result includes MTP speculative decoding.

Power defaults are explicit whole-machine assumptions, not measurements paired with the speed reports: **350 W** for the 4090 desktop, **450 W** for the 5090 desktop, **100 W** for the M4 Max Mac, and **200 W** for the M3 Ultra Mac Studio. The latter is a planning assumption below Apple's [270 W compute-stress measurement for the 80-core, 512 GB configuration](https://support.apple.com/en-us/102027), not a measured inference draw. GPU specifications and Apple's stress-test power figures are reference anchors, not LLM inference measurements. Use a wall meter to validate the power assumption before relying on the result.

## Memory-fit estimates

`memoryFit` in `data.js` compares approximate weight sizes or reported peak memory plus 20% planning headroom against GPU VRAM or Mac unified memory minus a 16 GB operating-system reserve. The weight inputs from the research are 17.7 GB for Qwen3.8 UD-Q4_K_XL, 22.1 GB for Qwen3.6 UD-Q4_K_M, and 18.3 GB for Gemma Q4_K_M. See the quantization listings for [Qwen3.8](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF), [Qwen3.6](https://huggingface.co/unsloth/Qwen3.6-35B-A3B-GGUF), and [Gemma](https://huggingface.co/unsloth/gemma-4-31B-it-GGUF).

Qwen3.6's estimated requirement of 26.5 GB exceeds the 24 GB configuration's budget, so its row is gray there. This is a conservative planning filter for the selected variant, not a claim that no quantization or shorter context could run on that GPU. Models within budget but lacking benchmarks stay distinct from over-budget rows. Fit is approximate, depends on runtime and context, and excludes CPU offload and vision projector overhead. Mac benchmark variants and peak memory are documented in the profile notes and source records. For the M3 Ultra profiles, fit uses the reported peak model memory rather than the smaller GPU weight-size assumptions. The new GLM and MiniMax models use their reported peaks (177.4 GB and 227.5 GB) as the conservative basis on other hardware too.

## Updating data

Edit `hardware`, `models`, and `profiles` in [data.js](./data.js). Every profile has a source URL, exact benchmark record ID, quantization, speed, and workload notes. The ten original records from the research's [Token Atlas](https://tokatlas.github.io/data/) download are retained in [data/benchmark-sources.json](./data/benchmark-sources.json). The record dates and claims are retained as supplied, including date inconsistencies. Benchmarks have not been independently reproduced. The five M3 Ultra source pages were checked against their live context tables on November 12, 2026; the earlier five records retain their original research provenance. Duplicate benchmark traces were not averaged.

When adding a pairing, verify memory fit for the exact quantization and context, preserve the original source record, and document the workload and power assumption. Keep missing data distinct from a model that does not fit.

## OpenRouter pricing

Each model in `data.js` has an `openRouterId`. The browser reads the public [model endpoint API](https://openrouter.ai/docs/api/api-reference/endpoints/list-all-endpoints-for-a-model) without credentials for all five models on page load or when **Refresh prices** is clicked. Hardware and electricity changes reuse the current quotes. Only the model ID is sent, never calculator inputs. A request timeout or API failure shows “Unavailable”; the affected row's profit remains unknown. Quotes are stored by model ID, separately from hardware selection. No API key or server proxy is embedded in the static site.

`openrouter.js` selects endpoints with active status (`status === 0`) and a finite, non-negative `pricing.completion`, then converts the per-token price to USD per million output tokens. It uses the listed price as returned, without reapplying the API's discount field. Equal output rates are resolved alphabetically by provider name. Free variants with separate model IDs are not included. The quote is the cheapest listed output rate, not the lowest total request cost or a guarantee of capacity, model quality, or matching quantization.

Brand artwork comes from the MeshLLM website. Typography follows its Geist / Geist Mono / Rajdhani choices; system fonts are the fallback.

## 512 GB Mac Studio benchmark profiles

The added hardware is specifically **Mac Studio M3 Ultra, 80 GPU cores, 512 GB unified memory**. Rates are individual oMLX community reports at 4K context with one request, not a controlled comparison. The source pages sometimes open another context from the same session; use the 4K row in the context table.

| Model | Local variant | Generation tok/s | Reported peak model memory | Source |
|---|---|---:|---:|---|
| Qwen3.8 27B | oQ4e, Lightning MTP | 111.1 | 25.0 GB | [oMLX](https://omlx.ai/benchmarks/performance/cs39n1ht) |
| Qwen3.6 35B-A3B | oQ4e, Lightning MTP | 157.4 | 23.0 GB | [oMLX](https://omlx.ai/benchmarks/performance/k5q6libm) |
| Gemma 4 31B | oQ8e (8-bit), VLM MTP | 34.1 | 35.0 GB | [oMLX](https://omlx.ai/benchmarks/performance/ei1g3dfm) |
| GLM-5.3 Flash | oQ4e, DFlash2 draft model | 70.4 | 177.4 GB | [oMLX](https://omlx.ai/benchmarks/performance/lyb5gcby) |
| MiniMax M3 | MLX 4-bit, no speculation | 19.7 | 227.5 GB | [oMLX](https://omlx.ai/benchmarks/performance/b810iglf) |

GLM's reported speed requires the GLM-5.3-Flash-DFlash2 draft model and the published DFlash settings. MiniMax has DFlash, MTP, and expert offload disabled. Gemma uses 8-bit weights on the Studio, so its speed is not directly comparable to the 4-bit M4 Max profile. Monthly values keep the generation-only, output-only scope and 200 W estimated wall-power assumption.
