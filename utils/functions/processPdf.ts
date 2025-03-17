// supabase/functions/process-pdf/index.ts
import { createClient } from "@supabase/supabase-js";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";
import { load as loadPDF } from "https://esm.sh/pdf-parse@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { documentId, filePath } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });
    const openai = new OpenAIApi(configuration);

    // Download the PDF from Supabase Storage
    const { data: fileData, error: fileError } = await supabaseClient.storage
      .from("pdfs")
      .download(filePath);

    if (fileError) throw fileError;

    // Extract text from the PDF
    const pdfBuffer = await fileData.arrayBuffer();
    const pdfData = await loadPDF(pdfBuffer);
    const text = pdfData.text;

    // Split the text into chunks
    const chunks = splitIntoChunks(text, 1000);

    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: chunk,
      });
      
      const embedding = response.data.data[0].embedding;
      
      return {
        document_id: documentId,
        chunk_index: index,
        content: chunk,
        embedding,
      };
    });

    const embeddings = await Promise.all(embeddingPromises);

    // Store the embeddings in Supabase
    const { error: embeddingError } = await supabaseClient
      .from("embeddings")
      .insert(embeddings);

    if (embeddingError) throw embeddingError;

    // Update the document status
    const { error: updateError } = await supabaseClient
      .from("documents")
      .update({ status: "processed" })
      .eq("id", documentId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: "PDF processed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(
      JSON.stringify({ message: error.message || "Error processing PDF" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper function to split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=\.|\?|\!)\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}