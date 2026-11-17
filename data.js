export const hardware = [
  {
    id: 'h200nvl2', activeWatts: 500, idleWatts: 280, idleNote: '180 W combined GPU idle draw measured by the user, plus an estimated 100 W host allowance. Active system power includes the measured 400 W GPU total plus the same 100 W host allowance. Host power is unverified.', name: '2 × H200 NVL', detail: '≈280 GB combined VRAM', kind: 'gpu',
    powerNote: '500 W estimated total-system active draw: 400 W combined GPU measurement plus 100 W estimated for the host. Not a measured wall-power result.',
    gpuCount: 2, memoryGB: 280, reservedMemoryGB: 0,
    setup: '2 GPUs · one request at a time',
    note: 'Reported MeshLLM benchmark: GLM-5.3 Flash UD-Q4_K_XL, MTP enabled, repeated long requests, one at a time. Approximately 90 output tok/s. Calculator uses estimated total-system power: 500 W active and 280 W idle; cooling, hardware rental and operations are excluded. Batching was not measured. Hosted quantization differs: the reported Relace offer uses FP4.',
  },
  { id: 'rtx4090', idleWatts: 60, idleNote: 'Estimated whole desktop idle draw: approximately 30 W GPU plus 30 W for CPU, RAM, storage, fans and power losses. Loaded-model idle was not measured on this desktop.', name: 'RTX 4090', detail: '24 GB VRAM', kind: 'gpu', memoryGB: 24, reservedMemoryGB: 0, activeWatts: 350, powerUrl: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/', powerNote: '350 W is an unverified whole-machine assumption. Geerling reports a 509.1 W system peak for gpt-oss 20B on a different 4090 PC; NVIDIA lists 450 W GPU TGP. Neither is an average wall measurement for this Qwen profile.' },
  { id: 'rtx5090', idleWatts: 75, idleNote: 'Estimated whole desktop idle draw: approximately 35 W GPU plus 40 W for the rest of the desktop. Published GPU-only desktop-idle tests vary roughly 25–46 W; loaded-model idle was not measured here.', name: 'RTX 5090', detail: '32 GB VRAM', kind: 'gpu', memoryGB: 32, reservedMemoryGB: 0, activeWatts: 450, powerUrl: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/', powerNote: '450 W is an unverified whole-machine assumption. Published Qwen3.8 vLLM measurements report roughly 380–440 W for the GPU alone, with a different workload. NVIDIA lists 575 W GPU TGP; neither validates this profile at the wall.' },
  { id: 'm4max', idleWatts: 10, idleNote: 'Estimated whole-Mac idle draw, awake with the model loaded. Apple reports 6 W for a smaller 32-GPU-core, 36 GB M4 Max Studio with Finder only; 10 W is a planning allowance for this 40-core, 64 GB configuration.', name: 'Mac M4 Max', detail: '64 GB · 40 GPU cores', kind: 'mac', memoryGB: 64, reservedMemoryGB: 16, activeWatts: 100, powerUrl: 'https://support.apple.com/en-us/102027', powerNote: '100 W is an unverified whole-machine assumption. The oMLX reports do not publish watts. Apple’s 145 W stress-test figure is for a 32-GPU-core, 36 GB Studio, not this 40-core, 64 GB configuration.' },
  { id: 'm3ultra', idleWatts: 15, idleNote: 'Estimated whole Studio idle draw with model residency. Apple reports 9 W at the wall for the 80-GPU-core, 512 GB configuration with Finder only; 15 W allows for the serving runtime and residency, not measured here.', name: 'Mac Studio M3 Ultra', detail: '512 GB · 80 GPU cores', kind: 'mac', memoryGB: 512, reservedMemoryGB: 16, activeWatts: 200, powerUrl: 'https://support.apple.com/en-us/102027', powerNote: '200 W is an unverified whole-machine assumption. Geerling reports a 227 W system peak for gpt-oss 20B on a 512 GB M3 Ultra; Apple reports 270 W at the wall under compute stress on the 80-core, 512 GB configuration. Neither measures average power for these oMLX profiles.' },
  {
    id: 'm3max8', activeWatts: 67.64876075195366 * 1.013249896863301 + 80, idleWatts: 80, idleNote: 'Estimated total for eight awake laptops at 10 W each, with displays off or dim and batteries charged. M3 Max review idle measurements are roughly 5–8 W under light display settings. Active system power includes an 80 W non-GPU allowance on top of the GPU compute estimate; neither allowance is measured on this cluster.', name: '8 × MacBook Pro M3 Max', detail: '64 GB each · 40 GPU cores each', kind: 'mac',
    powerNote: '148.55 W estimated total-system active draw: 68.55 W derived aggregate GPU compute power plus 80 W estimated for the rest of the eight laptops. Not a measured cluster wall-power result.',
    nodeCount: 8, memoryGB: 512, reservedMemoryGB: 128,
    setup: '8 stages · ideal saturated pipeline',
    note: 'Eight laptops, one resident stage each. Fixed-continuation slice benchmark: 67.65 tok/s is estimated aggregate capacity with enough independent requests; one request computes at 10.26 tok/s. Communication latency and scheduling overhead are ignored. Calculator uses estimated total-system power: 148.55 W active and 80 W idle. Prefill energy and extra memory/CPU activity remain unmeasured.',
  },
];

export const models = [
  { id: 'qwen38', name: 'Qwen3.8 27B', openRouterId: 'qwen/qwen3.8-27b', weightsGB: 17.7, defaultQuant: 'UD-Q4_K_XL' },
  { id: 'qwen36', name: 'Qwen3.6 35B-A3B', openRouterId: 'qwen/qwen3.6-35b-a3b', weightsGB: 22.1, defaultQuant: 'UD-Q4_K_M' },
  { id: 'gemma4', name: 'Gemma 4 31B', openRouterId: 'google/gemma-4-31b-it', weightsGB: 18.3, defaultQuant: 'Q4_K_M' },
  { id: 'glm53', name: 'GLM-5.3 Flash', openRouterId: 'z-ai/glm-5.3-flash', peakMemoryGB: 177.4, defaultQuant: 'oQ4e · DFlash2' },
  { id: 'minimaxm3', name: 'MiniMax M3', openRouterId: 'minimax/minimax-m3', peakMemoryGB: 227.5, defaultQuant: 'MLX 4-bit' },
];

export function memoryFit(machine, model, profile) {
  const stageTensorGB = profile?.stageTensorGB;
  const peakMemoryGB = profile?.peakMemoryGB ?? (profile?.weightsGB !== undefined ? undefined : model.peakMemoryGB);
  const requiredGB = (stageTensorGB ?? peakMemoryGB ?? profile?.weightsGB ?? model.weightsGB) * 1.2;
  const availableGB = (machine.memoryGB - machine.reservedMemoryGB) / (stageTensorGB !== undefined ? machine.nodeCount : 1);
  return { fits: requiredGB <= availableGB, requiredGB, availableGB, basis: stageTensorGB !== undefined ? 'largest stage tensor set per laptop' : peakMemoryGB !== undefined ? 'reported peak memory' : 'weight size' };
}

export const profiles = [
  {
    hardwareId: 'h200nvl2', modelId: 'glm53', tps: 90,
    quant: 'UD-Q4_K_XL · MTP on', weightsGB: 199.71,
    speedLabel: 'Approx. · single request',
    recordId: 'mesh-glm53-h200nvl2-mtp-single', sourceUrl: './data/glm53-h200nvl-benchmark.json',
    note: 'User-reported November 17, 2026: rented 2 × H200 NVL, roughly 280 GB combined VRAM, MeshLLM, GLM-5.3 Flash UD-Q4_K_XL, MTP enabled. Repeated long inference requests, one at a time: approximately 90 output tok/s and 400 W combined GPU power. Exact context/output lengths, repeat count, runtime/model revisions and raw traces were not supplied. Weight-size planning estimate is not measured peak VRAM. Relace FP4 is a different quantization; no batching gain is assumed.',
  },
  {
    hardwareId: 'm3max8', modelId: 'glm53', tps: 67.64876075195366,
    quant: '4-bit UD-Q4_K_XL · 8 stages', stageTensorGB: 29.02374892,
    speedLabel: 'Ideal pipeline estimate',
    recordId: 'mesh-glm53-m3max-eight-stage-metal', sourceUrl: './data/glm53-m3max-slice-benchmark.json',
    note: 'Skippy Metal, M3 Max 16 CPU / 40 GPU cores, 64 GB. Eight slices measured sequentially on one laptop, 391 prompt tokens, 511 teacher-forced decode steps, five repeats after warmup, speculation off. 67.6488 tok/s = 1000 / slowest stage ms/token; 10.2598 tok/s for one request. Summed GPU decode energy: 1.01325 J/token. No measured cluster throughput or full-model parity. Tensor-free metadata shard normalized from glm5next to glm5-next; weights unchanged.',
  },
  {
    hardwareId: 'rtx4090', modelId: 'qwen38', tps: 47.62, quant: 'UD-Q4_K_XL',
    memory: '≈17.7 GB weights', recordId: 'lc-30087-rtx4090-qwen3827b-tg128-master',
    sourceUrl: 'https://github.com/ggml-org/llama.cpp/issues/30087',
    note: 'RTX 4090 FE, llama.cpp CUDA, UD-Q4_K_XL. Reported tg128 generation: 47.62 tok/s, with Q8_0 key cache and Q4_0 value cache. Short generation test; longer contexts can change performance. Desktop assumes 64 GB system RAM.',
  },
  {
    hardwareId: 'rtx5090', modelId: 'qwen38', tps: 78.67, quant: 'Q4_K_M',
    memory: '32 GB GPU configuration', recordId: 'lc-29769-rtx5090-tg128-before',
    sourceUrl: 'https://github.com/ggml-org/llama.cpp/pull/29769',
    note: 'Single RTX 5090, llama.cpp, Q4_K_M and F16 KV cache. Reported tg128 generation: 78.67 tok/s, two rounds of five repetitions. Short generation test; context capacity is not established by this rate. Desktop assumes 64 GB system RAM.',
  },
  {
    hardwareId: 'm4max', modelId: 'qwen38', tps: 64.1, quant: 'MLX 4-bit · DFlash on',
    memory: '21.5 GB reported peak', recordId: 'omlx-yszhd8zc-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/yszhd8zc',
    note: 'M4 Max, 40 GPU cores, 64 GB unified memory, oMLX 4-bit, one request at 4K context, Code (Mixed). Reported generation: 64.1 tok/s; peak memory: 21.5 GB. Source settings checked 2026-11-13: DFlash enabled, draft-model identifier 015e795645c74b1a0eeef3b570031fb62e769bc5; MTP and expert offload disabled. This is an accelerated rate, not a no-speculation baseline.',
  },
  {
    hardwareId: 'm4max', modelId: 'qwen36', tps: 128.5, quant: 'MLX 4-bit',
    memory: '21.4 GB reported peak', recordId: 'omlx-j3u2wxoh-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/j3u2wxoh',
    note: 'M4 Max, 40 GPU cores, 64 GB unified memory, oMLX 4-bit, one request at 4K context, Code (Python). Reported generation: 128.5 tok/s; peak memory: 21.4 GB. Source settings checked 2026-11-13: DFlash, MTP, VLM MTP, and expert offload disabled.',
  },
  {
    hardwareId: 'm4max', modelId: 'gemma4', tps: 46.7, quant: 'oQ4e · MTP on',
    memory: '21.3 GB reported peak', recordId: 'omlx-m6ek9coc-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/m6ek9coc',
    note: 'M4 Max, 40 GPU cores, 64 GB unified memory, oMLX oQ4e, one request at 4K context, MTP speculative decoding enabled. Reported generation: 46.7 tok/s; peak memory: 21.3 GB. This runtime feature is part of the reported rate.',
  },
  {
    hardwareId: 'm3ultra', modelId: 'qwen38', tps: 111.1, quant: 'oQ4e · MTP on', peakMemoryGB: 25,
    memory: '25 GB reported peak', recordId: 'omlx-cs39n1ht-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/cs39n1ht',
    note: 'Mac Studio M3 Ultra, 80 GPU cores, 512 GB, oMLX v0.7.0, oQ4e, one request at 4K context, Code (Mixed), Lightning MTP enabled. Reported generation: 111.1 tok/s; peak memory: 25 GB. The linked session shows the 4K result in its context table.',
  },
  {
    hardwareId: 'm3ultra', modelId: 'qwen36', tps: 157.4, quant: 'oQ4e · MTP on', peakMemoryGB: 23,
    memory: '23 GB reported peak', recordId: 'omlx-k5q6libm-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/k5q6libm',
    note: 'Mac Studio M3 Ultra, 80 GPU cores, 512 GB, oMLX v0.7.1.dev2, oQ4e, one request at 4K context, Code (Python), Lightning MTP enabled. Reported generation: 157.4 tok/s; peak memory: 23 GB. The linked session shows the 4K result in its context table.',
  },
  {
    hardwareId: 'm3ultra', modelId: 'gemma4', tps: 34.1, quant: 'oQ8e · MTP on', peakMemoryGB: 35,
    memory: '35 GB reported peak', recordId: 'omlx-ei1g3dfm-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/ei1g3dfm',
    note: 'Mac Studio M3 Ultra, 80 GPU cores, 512 GB, oMLX v0.7.0, oQ8e (8-bit), one request at 4K context, Code (Python), VLM MTP enabled. Reported generation: 34.1 tok/s; peak memory: 35 GB. This is an 8-bit variant, unlike the 4-bit M4 Max profile.',
  },
  {
    hardwareId: 'm3ultra', modelId: 'glm53', tps: 70.4, quant: 'oQ4e · DFlash2', peakMemoryGB: 177.4,
    memory: '177.4 GB reported peak', recordId: 'omlx-lyb5gcby-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/lyb5gcby',
    note: 'Mac Studio M3 Ultra, 80 GPU cores, 512 GB, oMLX v0.7.0, oQ4e, one request at 4K context, Code (Mixed), DFlash enabled with GLM-5.3-Flash-DFlash2; MTP and expert offload disabled. Reported generation: 70.4 tok/s; peak model memory: 177.4 GB. Reproducing this speed requires the draft model and settings.',
  },
  {
    hardwareId: 'm3ultra', modelId: 'minimaxm3', tps: 19.7, quant: 'MLX 4-bit', peakMemoryGB: 227.5,
    memory: '227.5 GB reported peak', recordId: 'omlx-b810iglf-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/b810iglf',
    note: 'Mac Studio M3 Ultra, 80 GPU cores, 512 GB, oMLX v0.7.1rc1, 4-bit, one request at 4K context, Code (Python), DFlash, MTP, and expert offload disabled. Reported generation: 19.7 tok/s; peak model memory: 227.5 GB. A single community run.',
  },
];
