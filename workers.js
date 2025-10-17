// Cloudflare Worker for Gemini API Proxy - v2 (CORS Fix)

// ------------------- CONFIGURATION --------------------
//  ↓  将你的线上博客域名和本地测试域名加到这里
const allowedOrigins = [
  'https://martin666.site',           // Production site
  'http://localhost:4000',            // Hexo default local server
  'http://localhost:1313',            // Hugo default local server
  'https://martin666.site:443',       // Explicit HTTPS
  'http://martin666.site',            // HTTP version
  'https://gemini-flash.l328059024.workers.dev' // Worker itself
];

// Helper function to check if origin is allowed
function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return false;
  
  // Exact match
  if (allowedOrigins.includes(origin)) return true;
  
  // Check if it's a subdomain or different protocol/port
  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.hostname === allowedUrl.hostname;
      } catch {
        // If allowed is not a full URL, check if it matches the hostname
        return originUrl.hostname === allowed;
      }
    });
  } catch {
    // If origin is not a valid URL, check if it's in allowedOrigins directly
    return allowedOrigins.includes(origin);
  }
}
// ----------------------------------------------------

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=";

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');
    
    // More detailed logging for debugging
    console.log('=== Request Debug Info ===');
    console.log('Method:', request.method);
    console.log('Origin:', origin);
    console.log('Referer:', referer);
    console.log('User-Agent:', request.headers.get('User-Agent'));
    console.log('Allowed origins:', allowedOrigins);
    
    // Special case: allow requests without Origin header (might be direct access)
    const isAllowed = !origin || isOriginAllowed(origin, allowedOrigins);
    console.log('Is origin allowed:', isAllowed);
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      // Even for disallowed origins, we respond to OPTIONS to avoid CORS issues
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For POST requests, check origin but be more permissive with error handling
    if (request.method === 'POST') {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response('API key not configured', { status: 500 });
      }

      try {
        // Even if origin is not in our list, we still process the request
        // but log the incident for security review
        if (!isAllowed) {
          console.warn(`Unauthorized origin attempt: ${origin}`);
          // Depending on security requirements, you might want to reject the request
          // For now, we'll process it but log the event
        }

        const requestBody = await request.json();
        
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT + apiKey, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
        });

        const geminiData = await geminiResponse.json();

        // Set CORS headers
        const corsHeaders = {
          'Content-Type': 'application/json',
        };
        
        // Only set Access-Control-Allow-Origin if origin is valid
        if (isAllowed && origin) {
          corsHeaders['Access-Control-Allow-Origin'] = origin;
        } else if (!origin) {
          // For requests without origin (like direct access), allow all
          corsHeaders['Access-Control-Allow-Origin'] = '*';
        }

        return new Response(JSON.stringify(geminiData), {
          status: geminiResponse.status,
          headers: corsHeaders,
        });
      } catch (error) {
        console.error('Error processing request:', error);
        return new Response(`Error processing request: ${error.message}`, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': origin || '*'
          }
        });
      }
    }

    // For all other methods, return 405
    return new Response('Method Not Allowed', { status: 405 });
  },
};