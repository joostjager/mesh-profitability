export const hardware = [
  { id: 'rtx4090', name: 'RTX 4090', detail: '24 GB VRAM', kind: 'gpu', memoryGB: 24, reservedMemoryGB: 0, watts: 350, powerUrl: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/' },
  { id: 'rtx5090', name: 'RTX 5090', detail: '32 GB VRAM', kind: 'gpu', memoryGB: 32, reservedMemoryGB: 0, watts: 450, powerUrl: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/' },
  { id: 'm4max', name: 'Mac M4 Max', detail: '64 GB · 40 GPU cores', kind: 'mac', memoryGB: 64, reservedMemoryGB: 16, watts: 100, powerUrl: 'https://support.apple.com/en-us/102027' },
  { id: 'm3ultra', name: 'Mac Studio M3 Ultra', detail: '512 GB · 80 GPU cores', kind: 'mac', memoryGB: 512, reservedMemoryGB: 16, watts: 200, powerUrl: 'https://support.apple.com/en-us/102027' },
];

export const models = [
  { id: 'qwen38', name: 'Qwen3.8 27B', openRouterId: 'qwen/qwen3.8-27b', weightsGB: 17.7, defaultQuant: 'UD-Q4_K_XL' },
  { id: 'qwen36', name: 'Qwen3.6 35B-A3B', openRouterId: 'qwen/qwen3.6-35b-a3b', weightsGB: 22.1, defaultQuant: 'UD-Q4_K_M' },
  { id: 'gemma4', name: 'Gemma 4 31B', openRouterId: 'google/gemma-4-31b-it', weightsGB: 18.3, defaultQuant: 'Q4_K_M' },
  { id: 'glm53', name: 'GLM-5.3 Flash', openRouterId: 'z-ai/glm-5.3-flash', peakMemoryGB: 177.4, defaultQuant: 'oQ4e · DFlash2' },
  { id: 'minimaxm3', name: 'MiniMax M3', openRouterId: 'minimax/minimax-m3', peakMemoryGB: 227.5, defaultQuant: 'MLX 4-bit' },
];

export function memoryFit(machine, model, profile) {
  const peakMemoryGB = profile?.peakMemoryGB ?? model.peakMemoryGB;
  const requiredGB = (peakMemoryGB ?? model.weightsGB) * 1.2;
  const availableGB = machine.memoryGB - machine.reservedMemoryGB;
  return { fits: requiredGB <= availableGB, requiredGB, availableGB, basis: peakMemoryGB !== undefined ? 'reported peak memory' : 'weight size' };
}

export const profiles = [
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
    hardwareId: 'm4max', modelId: 'qwen38', tps: 64.1, quant: 'MLX 4-bit',
    memory: '21.5 GB reported peak', recordId: 'omlx-yszhd8zc-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/yszhd8zc',
    note: 'M4 Max, 40 GPU cores, 64 GB unified memory, oMLX 4-bit, one request at 4K context. Reported generation: 64.1 tok/s; peak memory: 21.5 GB. The source record does not establish speculative-decoding settings.',
  },
  {
    hardwareId: 'm4max', modelId: 'qwen36', tps: 128.5, quant: 'MLX 4-bit',
    memory: '21.4 GB reported peak', recordId: 'omlx-j3u2wxoh-ctx4096',
    sourceUrl: 'https://omlx.ai/benchmarks/performance/j3u2wxoh',
    note: 'M4 Max, 40 GPU cores, 64 GB unified memory, oMLX 4-bit, one request at 4K context. Reported generation: 128.5 tok/s; peak memory: 21.4 GB. The source record does not establish speculative-decoding settings.',
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
