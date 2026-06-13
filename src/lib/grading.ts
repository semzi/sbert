import { pipeline, env } from '@xenova/transformers';

// Configuration for browser environment — load from public/models/ only
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';
env.useBrowserCache = false; // Disable browser cache to avoid stale cached HTML responses

// Disable WASM proxy to avoid worker-based fetching issues
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

let extractor: any = null;

// Initialize the feature-extraction pipeline (Sentence-BERT)
export async function initExtractor(onProgress?: (progress: any) => void) {
  if (!extractor) {
    console.log('--- SBERT MODEL INITIALIZATION START (LOCAL MODE) ---');
    try {
      // Library will look in public/models/Xenova/all-MiniLM-L6-v2/ due to env.localModelPath
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Specifically use the quantized onnx model we downloaded
        progress_callback: (progress: any) => {
          if (onProgress) onProgress(progress);
        }
      });
      console.log('--- SBERT MODEL LOADED SUCCESSFULLY FROM LOCAL STORAGE ---');
    } catch (error) {
      console.error('--- SBERT MODEL LOAD FAILED ---', error);
      throw error;
    }
  }
  return extractor;
}

// Calculate Cosine Similarity between two sentence embeddings
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple Lexical (Jaccard) Similarity for Comparative Analysis
function lexicalSimilarity(str1: string, str2: string) {
  const s1 = new Set(str1.toLowerCase().trim().split(/\s+/));
  const s2 = new Set(str2.toLowerCase().trim().split(/\s+/));
  if (s1.size === 0 || s2.size === 0) return 0;
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  return intersection.size / union.size;
}

export async function calculateEssayGrade(studentAnswer: string, referenceAnswer: string, threshold: number, onProgress?: (p: any) => void) {
  try {
    const extractorInstance = await initExtractor(onProgress);
    
    console.log('Calculating semantic similarity...');
    
    // 1. SBERT Similarity (Semantic)
    const output = await extractorInstance([studentAnswer, referenceAnswer], {
      pooling: 'mean',
      normalize: true,
    });
    
    const embedding1 = Array.from(output[0].data as number[]);
    const embedding2 = Array.from(output[1].data as number[]);
    
    const semanticSimilarity = cosineSimilarity(embedding1, embedding2);
    const semanticPercentage = Math.round(semanticSimilarity * 100);

    // 2. Lexical Similarity (Keyword Matching - Baseline)
    const lexicalSim = lexicalSimilarity(studentAnswer, referenceAnswer);
    const lexicalPercentage = Math.round(lexicalSim * 100);

    console.log(`Results: ${semanticPercentage}% Semantic, ${lexicalPercentage}% Lexical`);

    return {
      similarityScore: semanticPercentage,
      lexicalScore: lexicalPercentage,
      passed: semanticPercentage >= threshold,
      feedback: semanticPercentage >= threshold 
        ? `Cognitive match identified. The submission aligns with ${semanticPercentage}% of the target semantic intent.`
        : `Insufficient alignment. The submission only reached ${semanticPercentage}% semantic similarity (Target: ${threshold}%).`
    };
  } catch (error) {
    console.error('Error during essay analysis:', error);
    throw error;
  }
}
