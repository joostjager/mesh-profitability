# Mesh inference electricity calculator

A static calculator for electricity cost per million output tokens, styled to match [meshllm.cloud](https://meshllm.cloud/). Choose two H200 NVL GPUs, an RTX 4090 desktop, RTX 5090 desktop, 64 GB M4 Max Mac, 512 GB M3 Ultra Mac Studio, or eight 64 GB M3 Max MacBook Pros, then compare all five models in a desktop table. Inputs are hardware, electricity price (default **$0.20/kWh**), utilization (default **100%**), with idle power estimated from the selected hardware.

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
active hours                   = 720 × utilization percent / 100
idle hours                     = 720 − active hours
monthly output revenue         = tokens per second × 3,600 / 1,000,000 × hosted output USD per million × active hours
monthly active electricity     = (benchmark watts + active host allowance) / 1,000 × USD per kWh × active hours
monthly idle electricity       = whole-setup idle watts / 1,000 × USD per kWh × idle hours
monthly profit                 = monthly output revenue − active electricity − idle electricity
```

Active per-million-token columns retain their benchmark power scope and exclude idle and separate monthly host allowances. Monthly profit uses the selected busy-time percentage, assumes all output sells at the cheapest listed OpenRouter rate, and pays for the hardware remaining awake during the rest of the month. It is an optimistic output-revenue scenario, not measured net profit. Prompt processing, input revenue/charges, hardware/rental, cooling, networking and fees are excluded. Utilization changes active hours, not busy-time tok/s or batch size; no batching efficiency gain is inferred. Unknown benchmarks remain unknown. The laptop-cluster profile retains its ideal aggregate pipeline capacity.

## Utilization and idle power

The slider spans 0–100% of a fixed 720-hour month. At 0%, output revenue and active electricity are zero, but the entire month incurs idle electricity. At 100%, idle electricity is zero. Between them, active and idle energy are weighted by their respective hours, so idle power is not added again during active hours. Hardware remains awake with the model loaded, displays off/dim and batteries charged; there is no automatic sleep or shutdown. Idle power is a fixed property of the selected hardware, displayed below the utilization slider.

| Configuration | Default whole-setup idle | Separate active host allowance | Basis |
|---|---:|---:|---|
| 2 × H200 NVL | **280 W** | **100 W** | User measured **180 W combined GPU idle** (2 × 90 W); add an unverified 100 W host budget |
| RTX 4090 desktop | **60 W** | 0 W | Approximately 30 W GPU + 30 W desktop; active default already covers the whole machine |
| RTX 5090 desktop | **75 W** | 0 W | Approximately 35 W GPU + 40 W desktop; active default already covers the whole machine |
| M4 Max 64 GB | **10 W** | 0 W | Apple reports 6 W idle on a smaller Studio; allowance for larger configuration and serving/runtime activity |
| M3 Ultra Studio 512 GB | **15 W** | 0 W | Apple reports 9 W idle on this configuration with Finder only; allowance for model/runtime residency |
| 8 × M3 Max MacBook Pro | **80 W total** | **80 W total** | Eight times 10 W awake idle; separate active allowance for non-GPU components |

These defaults are planning estimates, not matched loaded-model wall-power measurements. The measured H200 GPU component is preserved separately. [Power assumptions and source anchors](./data/power-assumptions.json) document the reasoning and limits. Apple's [Mac Studio wall-power table](https://support.apple.com/en-us/102027), [ServeTheHome's 4090 GPU measurement](https://www.servethehome.com/nvidia-geforce-rtx-4090-founders-edition-review-the-gpu/7/), [GamersNexus's 5090 measurement](https://devtest.gamersnexus.net/gpus/nvidia-geforce-rtx-5090-founders-edition-review-benchmarks-gaming-thermals-power), and [Notebookcheck's M3 Max measurements](https://www.notebookcheck.net/Apple-MacBook-Pro-16-2023-M3-Max-Review-M3-Max-challenges-HX-CPUs-from-AMD-Intel.766414.0.html) are reference anchors, not validation of these exact serving setups.

The H200 active measurement is GPU-only, so monthly calculations use **400 + 100 = 500 W active** and **180 + 100 = 280 W idle**. The laptop cluster uses **68.545 + 80 = 148.545 W active** and **80 W idle**. Active allowances and idle power are independent hardware properties. Actual CPU/DRAM and conversion losses can be higher. This avoids presenting GPU-only active draw and whole-machine idle draw as if they covered the same components, but it does not turn the result into a measured wall-power estimate. The per-token GPU measurements remain unchanged. Other hardware's active figures already represent whole-machine assumptions, so no additional host power is added.

At $0.20/kWh, 0% utilization costs $40.32/month for the H200 setup and $11.52 for the eight laptops. At the recorded Relace output rate of $0.0784/M, the H200 scenario gives **−$53.71/month at 100%** or **−$47.02 at 50%**, including the new host allowance. More utilization need not improve profit when the active marginal cost exceeds revenue.

The initial shortlist is Qwen3.8 27B, Qwen3.6 35B-A3B, and Gemma 4 31B, based on the OpenRouter popularity research from November 12, 2026. GLM-5.3 Flash and MiniMax M3 extend it to larger models. Ten pairings have curated community speed benchmarks, and the eight-laptop GLM profile adds an estimate from locally measured slices. All models remain visible; compatibility is assessed separately from benchmark availability. A compatible model without a speed benchmark has unknown energy, electricity cost, and monthly profit. Quantizations and benchmark contexts differ across profiles. Gemma's Mac result includes MTP speculative decoding.

Power defaults are explicit whole-machine assumptions, not measurements paired with the speed reports: **350 W** for the 4090 desktop, **450 W** for the 5090 desktop, **100 W** for the M4 Max Mac, and **200 W** for the M3 Ultra Mac Studio. The latter is a planning assumption below Apple's [270 W compute-stress measurement for the 80-core, 512 GB configuration](https://support.apple.com/en-us/102027), not a measured inference draw. GPU specifications and Apple's stress-test power figures are reference anchors, not LLM inference measurements. Use a wall meter to validate the power assumption before relying on the result.

## Memory-fit estimates

`memoryFit` in `data.js` compares approximate weight sizes or reported peak memory plus 20% planning headroom against GPU VRAM or Mac unified memory minus a 16 GB operating-system reserve. The weight inputs from the research are 17.7 GB for Qwen3.8 UD-Q4_K_XL, 22.1 GB for Qwen3.6 UD-Q4_K_M, and 18.3 GB for Gemma Q4_K_M. See the quantization listings for [Qwen3.8](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF), [Qwen3.6](https://huggingface.co/unsloth/Qwen3.6-35B-A3B-GGUF), and [Gemma](https://huggingface.co/unsloth/gemma-4-31B-it-GGUF).

Qwen3.6's estimated requirement of 26.5 GB exceeds the 24 GB configuration's budget, so its row is gray there. This is a conservative planning filter for the selected variant, not a claim that no quantization or shorter context could run on that GPU. Models within budget but lacking benchmarks stay distinct from over-budget rows. Fit is approximate, depends on runtime and context, and excludes CPU offload and vision projector overhead. Mac benchmark variants and peak memory are documented in the profile notes and source records. For the M3 Ultra profiles, fit uses the reported peak model memory rather than the smaller GPU weight-size assumptions. The new GLM and MiniMax models use their reported peaks (177.4 GB and 227.5 GB) as the conservative basis on other hardware too.

## Updating data

Edit `hardware`, `models`, and `profiles` in [data.js](./data.js). Every profile has a source URL, exact benchmark record ID, quantization, speed, and workload notes. The ten original records from the research's [Token Atlas](https://tokatlas.github.io/data/) download are retained in [data/benchmark-sources.json](./data/benchmark-sources.json). The record dates and claims are retained as supplied, including date inconsistencies. Benchmarks have not been independently reproduced. All ten rates were checked against their original GitHub or oMLX reports on November 13, 2026. The [audit](./data/benchmark-audit.json) records context, acceleration settings, source checksums, collection coverage, and the absence of matched average wall-power measurements. Duplicate benchmark traces were not averaged.

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

## Dual H200 NVL benchmark

The user reported a rented **2 × H200 NVL** configuration with roughly **280 GB combined VRAM**, running **GLM-5.3 Flash UD-Q4_K_XL** through MeshLLM with **MTP speculative decoding enabled**. Repeated long requests ran one at a time, yielding approximately **90 output tok/s** at **400 W combined GPU power**. These are paired user-reported measurements, not an independently reproduced result. The exact model/runtime revisions, context/output lengths, repeat count, sensor methodology and raw traces were not supplied. The [source record](./data/glm53-h200nvl-benchmark.json) preserves those limits.

The calculator uses the reported values without rounding intermediate calculations: `400 / 90 = 4.4444 GPU J/output token`, `1.234568 kWh/million output tokens`, and **$0.246914/million at $0.20/kWh**. The 400 W covers both GPUs together. It excludes CPU/RAM, power-supply losses, cooling, rental, hardware and operations. No batching gain is assumed, and this profile's power is not assigned to other models without measurements.

The user's accompanying OpenRouter snapshot lists Relace at **$0.0784/million output tokens** and **$0.0399/million input tokens**, using **FP4** rather than our GGUF variant. The calculator continues to fetch live output prices rather than freezing that quote. At that output rate and 100% utilization, the GPU-only calculation gives $18.29 output revenue minus $57.60 GPU electricity, or **−$39.31/month before host costs**. The current monthly column also includes the separate 100 W host allowance, producing **−$53.71/month**; lower utilization adds idle electricity as described above. Input revenue and prompt-processing costs remain outside the calculator's scope. Memory fit uses approximately 199.71 GB of weights plus 20% headroom against combined VRAM, not a measured peak allocation.

## Eight-laptop GLM slice benchmark

The configuration is **eight MacBook Pros, each with an Apple M3 Max, 16 CPU cores, 40 GPU cores, and 64 GB unified memory**. This matches the laptop used for the [benchmark chat](codex://threads/01a1d4be-1923-72f3-bb66-8f4c94609dd9), confirmed locally on November 16, 2026. Each laptop is assumed to hold one resident stage. All eight stages were actually measured sequentially on one laptop, rather than on a physical cluster. The exact [JSON report](./data/glm53-m3max-slice-benchmark.json) is retained unchanged.

The model is Unsloth GLM-5.3 Flash **UD-Q4_K_XL**, revision `621d456e93e926e4b52f85cff5f634358c1828f9`, using Skippy Metal without speculative decoding. The workload has 391 prompt tokens, 512 fixed output positions (511 teacher-forced decode steps), one warmup and five timed repeats per slice. Captured activations matched replay, but the full model could not fit for an unsplit parity comparison. The tensor-free metadata shard was normalized from `glm5next` to `glm5-next`; weights were unchanged.

| Calculator quantity | Value | Derivation |
|---|---:|---|
| Aggregate output capacity | 67.6488 tok/s | 1,000 / slowest slice's 14.7822 ms/token |
| One request's compute rate | 10.2598 tok/s | 1,000 / summed 97.4680 ms/token |
| GPU decode energy | 1.01325 J/output token | Sum of measured slice GPU watts × timed seconds/token |
| Equivalent aggregate GPU compute power | 68.5451 W | Aggregate tok/s × GPU J/token |
| Energy per million output tokens | 0.281458 kWh | GPU J/token / 3.6 |
| Cost at $0.20/kWh | $0.056292 / million | GPU energy × electricity price |

The displayed capacity assumes enough independent requests to saturate an eight-stage pipeline. Communication latency, scheduling overhead and prompt processing are ignored. The report's workload-inclusive pipeline estimate is 64.8381 output tok/s, but this calculator consistently uses decode-only rates. Neither rate is measured cluster throughput.

Energy comes from macmon/IOReport and covers only the GPU share of SoC power. The derived 68.55 W is aggregate GPU compute power at the ideal rate, not the sum of the eight active-stage wattages and not wall power. CPU, memory, waiting-machine power and prefill energy are absent from this measurement. The monthly column now adds an estimated 80 W non-GPU active allowance and the hardware's estimated idle power during non-serving hours; the per-token columns retain GPU-only energy. These allowances do not establish measured cluster power. Live OpenRouter quotes are used as for other profiles; hosted quantization can differ.

Memory fit checks the largest stage tensor set, 29.02375 GB, plus 20% headroom against 48 GB per laptop after the 16 GB reserve. Tensor bytes exclude KV/cache and scratch allocations, so this remains a planning check rather than a measured memory peak. Other cluster rows have no speed or power profile; their fit uses aggregate memory and does not prove a valid partition.

## Benchmark and power audit, November 13, 2026

All ten numerical generation rates match their original reports and the current Token Atlas download. None required a numeric correction. This confirms faithful transcription, not independent reproduction or a prediction for every prompt. Token Atlas repeats the same original sources and is not a second experiment. No independent result matching the exact hardware, model variant, context, runtime, and acceleration settings was found in the other suggested collections.

One missing qualification was corrected: **Qwen3.8 27B on the M4 Max at 64.1 tok/s uses DFlash**. The original oMLX settings have `dflash_enabled: true`, draft identifier `015e795645c74b1a0eeef3b570031fb62e769bc5`, and MTP disabled. The calculator now labels this explicitly. Qwen3.6 35B-A3B on the M4 Max at 128.5 tok/s has DFlash and MTP disabled. All oMLX profiles use one request at 4K context; the GPU profiles use short `tg128` generation tests. Code-dependent speculative rates should not be compared as universal no-speculation baselines.

| Hardware | Model | Confirmed output tok/s | Runtime and acceleration | Original report |
|---|---|---:|---|---|
| RTX 4090 FE | Qwen3.8 27B, UD-Q4_K_XL | 47.62 | llama.cpp CUDA, master build, tg128 | [llama.cpp #30087](https://github.com/ggml-org/llama.cpp/issues/30087) |
| RTX 5090 | Qwen3.8 27B, Q4_K_M | 78.67 | llama.cpp, single-sequence tg128, before patch | [llama.cpp #29769](https://github.com/ggml-org/llama.cpp/pull/29769) |
| M4 Max, 40 GPU cores, 64 GB | Qwen3.8 27B, MLX 4-bit | 64.1 | oMLX, Code (Mixed), DFlash on | [oMLX](https://omlx.ai/benchmarks/performance/yszhd8zc) |
| M4 Max, 40 GPU cores, 64 GB | Qwen3.6 35B-A3B, MLX 4-bit | 128.5 | oMLX, Code (Python), no DFlash or MTP | [oMLX](https://omlx.ai/benchmarks/performance/j3u2wxoh) |
| M4 Max, 40 GPU cores, 64 GB | Gemma 4 31B, oQ4e | 46.7 | oMLX, Code (Python), MTP on | [oMLX](https://omlx.ai/benchmarks/performance/m6ek9coc) |
| M3 Ultra, 80 GPU cores, 512 GB | Qwen3.8 27B, oQ4e | 111.1 | oMLX, Code (Mixed), Lightning MTP | [oMLX](https://omlx.ai/benchmarks/performance/cs39n1ht) |
| M3 Ultra, 80 GPU cores, 512 GB | Qwen3.6 35B-A3B, oQ4e | 157.4 | oMLX, Code (Python), Lightning MTP | [oMLX](https://omlx.ai/benchmarks/performance/k5q6libm) |
| M3 Ultra, 80 GPU cores, 512 GB | Gemma 4 31B, oQ8e | 34.1 | oMLX, Code (Python), VLM MTP | [oMLX](https://omlx.ai/benchmarks/performance/ei1g3dfm) |
| M3 Ultra, 80 GPU cores, 512 GB | GLM-5.3 Flash, oQ4e | 70.4 | oMLX, Code (Mixed), DFlash2 | [oMLX](https://omlx.ai/benchmarks/performance/lyb5gcby) |
| M3 Ultra, 80 GPU cores, 512 GB | MiniMax M3, MLX 4-bit | 19.7 | oMLX, Code (Python), no speculation | [oMLX](https://omlx.ai/benchmarks/performance/b810iglf) |

### Power evidence

**None of the ten selected profiles has a matching average whole-machine wall-power measurement in the sources checked. All four calculator power defaults therefore remain unverified assumptions.** A measured peak, GPU board rating, or GPU-only telemetry value must not be substituted as a measured inference average. The UI labels these assumptions and exposes the hardware-specific qualification on the power cell's tooltip.

| Calculator hardware | Retained wall-power assumption | Published evidence located | Why it does not verify the default |
|---|---:|---|---|
| RTX 4090 desktop | 350 W | Geerling: 509.1 W reported system peak for gpt-oss 20B on an Intel 265K PC; NVIDIA: 450 W GPU TGP | Different model, host, and runtime; peak rather than mean; TGP covers the card only |
| RTX 5090 desktop | 450 W | wesionaryTEAM: approximately 380–440 W GPU draw while answering with Qwen3.8 27B in vLLM; NVIDIA: 575 W GPU TGP | GPU-only sampling, different serving workload/runtime and unspecified exact 4-bit variant; excludes host and does not match the selected llama.cpp report |
| M4 Max, 40 GPU cores, 64 GB | 100 W | Apple: 145 W maximum wall draw for a **32-GPU-core, 36 GB** M4 Max Studio | Different hardware configuration and a compute stress test, not this profile's average inference draw |
| M3 Ultra, 80 GPU cores, 512 GB | 200 W | Geerling: 227 W system peak for gpt-oss 20B on a 512 GB M3 Ultra; Apple: 270 W wall draw for an 80-GPU-core, 512 GB Studio under compute stress | Different model/runtime for Geerling; stress rather than inference for Apple; neither establishes the selected oMLX profiles' mean watts |

Primary references: [Geerling M3 Ultra measurement](https://github.com/geerlingguy/ai-benchmarks/issues/42#issuecomment-3624042296), [Geerling RTX 4090 measurement](https://github.com/geerlingguy/ai-benchmarks/issues/43#issuecomment-3634421006), [Geerling Findings with the explicit “Power (Peak)” heading](https://github.com/geerlingguy/ai-benchmarks/tree/2f56f19fe9f90f999eb20944402895a653ebd7f2#findings), [wesionaryTEAM GPU measurement method](https://wesionary.team/en/posts/local-llm-power-cost), [Apple wall-power methodology and tested configurations](https://support.apple.com/en-us/102027), [RTX 4090 specification](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/), and [RTX 5090 specification](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/).

### Coverage of the suggested collections

- **[ML.ENERGY v3](https://huggingface.co/datasets/ml-energy/benchmark-v3):** the public dataset card specifies H100/B200 and average GPU power. Those devices and that power scope do not match the calculator's consumer-GPU/Mac whole-machine assumptions. The raw data is gated and was not downloaded or used.
- **[Geerling](https://github.com/geerlingguy/ai-benchmarks):** the current Findings table has no exact match for the calculator's five model identities. The supplied gpt-oss 20B examples are confirmed: 115.29 tok/s and 227 W peak on the M3 Ultra 512 GB; 279.65 tok/s and 509.1 W peak on the Intel 265K/RTX 4090 PC. These are useful other-model reference points, not cross-validation of the calculator rates. The checked revision is `2f56f19fe9f90f999eb20944402895a653ebd7f2`.
- **[HWBench](https://www.gethwbench.com/find.json?task=LLM+generation):** checked the default edge-hardware JSON results, containing 555 platform results. No selected hardware/model pair matched. Relevant Qwen3.6/Gemma entries are on Jetson hardware and use module TDP; the Qwen3.8 entry is on Strix Halo and uses chip TDP. Some Geerling entries repeat the same underlying reports, so they are not independent evidence.
- **[Token Atlas](https://tokatlas.github.io/data/records.json):** all ten selected records match; 13 of 41,103 records have a populated `power_w`. This is a count of populated fields, not 13 verified average wall-power measurements. For example, Qwen3.8/RTX 5090 NVFP4 records describe a stock 575 W setting, which is not enough to establish measured average power and also differs from the calculator's Q4_K_M profile.
- **[oMLX](https://omlx.ai/benchmarks/performance):** directly checked all eight selected Mac reports, their 4K context rows, hardware configurations, and acceleration settings. No published watts or whole-machine energy value was located. CPU/GPU utilization percentages and memory footprints cannot supply that missing measurement.

For reference, every additional 100 W of assumed average wall power costs $14.40 over 720 hours at $0.20/kWh. This sensitivity applies directly to maximum monthly profit; the present figures remain scenario calculations rather than measured electricity costs. There was no numerical rate, wattage, or formula change in this audit.
