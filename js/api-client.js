// API Client for Durian Analytics
// ================================

// AI for Thai API Client
async function callAIForthai(text) {
    const url = CONFIG.AIFORTHAI_ENDPOINT + '?text=' + encodeURIComponent(text);
    const res = await fetch(url, { 
        method: 'GET', 
        headers: { 'Apikey': CONFIG.AIFORTHAI_API_KEY } 
    });
    if (!res.ok) throw new Error(`AI for Thai error: ${res.status} ${res.statusText}`);
    return res.json();
}

// Gemini API Client for Campaign Generation
async function callGeminiCampaign(text, polarity, keywords) {
    if (!CONFIG.GEMINI_API_KEY) throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY');
    
    const prompt = [
        "คุณคือ Copywriter โปรโมททุเรียน ช่วยเขียนไอเดียแคมเปญสั้น ๆ (ภาษาไทย)",
        `Polarity: ${toThaiPolarity(polarity)} (${polarity})`,
        `Keywords: ${keywords.slice(0,10).join(", ")}`,
        "กรุณาตอบในรูปแบบ JSON เท่านั้น โดยไม่มีข้อความอื่น:",
        "{\"taglines\":[\"ข้อความโปรโมท 1\",\"ข้อความโปรโมท 2\",\"ข้อความโปรโมท 3\"],\"idea\":\"ไอเดียแคมเปญหลัก\"}"
    ].join("\n");
    
    const body = { 
        contents: [{role: "user", parts: [{text: prompt}]}], 
        generationConfig: { 
            temperature: CONFIG.DEFAULT_TEMPERATURE, 
            maxOutputTokens: CONFIG.DEFAULT_MAX_TOKENS 
        } 
    };
    
    const res = await fetch(CONFIG.GEMINI_ENDPOINT, {
        method: "POST", 
        headers: { 
            "Content-Type": "application/json", 
            "x-goog-api-key": CONFIG.GEMINI_API_KEY 
        }, 
        body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error(`Gemini error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    
    // ตรวจสอบ response structure หลายแบบ
    let jsonStr = "";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        jsonStr = data.candidates[0].content.parts[0].text.trim();
    } else if (data?.candidates?.[0]?.content?.text) {
        jsonStr = data.candidates[0].content.text.trim();
    } else if (data?.candidates?.[0]?.text) {
        jsonStr = data.candidates[0].text.trim();
    } else if (data?.candidates?.[0]?.content?.parts) {
        for (let i = 0; i < data.candidates[0].content.parts.length; i++) {
            if (data.candidates[0].content.parts[i].text) {
                jsonStr = data.candidates[0].content.parts[i].text.trim();
                break;
            }
        }
    } else if (data?.candidates?.[0]?.content) {
        const content = data.candidates[0].content;
        for (const key in content) {
            if (key !== 'role' && typeof content[key] === 'string' && content[key].trim()) {
                jsonStr = content[key].trim();
                break;
            }
        }
    }
    
    // หากไม่มีข้อความเลย ให้ใช้ fallback
    if (!jsonStr) {
        console.error('No text content found in Gemini response');
        throw new Error('No text content found in Gemini response');
    }
    
    // ทำความสะอาด JSON string
    if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json|```/g,'').trim();
    }
    
    // ลบข้อความที่ไม่ใช่ JSON
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }
    
    try {
        return JSON.parse(jsonStr);
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw response:', jsonStr);
        
        // สร้าง fallback response
        return {
            taglines: [
                "ราชาแห่งรสชาติ สดใหม่จากสวน",
                "หวาน มัน หอม — คัดพิเศษ", 
                "คุ้มทุกคำ ส่งไวถึงบ้าน"
            ],
            idea: "แคมเปญโปรโมททุเรียนคุณภาพพรีเมียม พร้อมบริการจัดส่งถึงบ้าน"
        };
    }
}

// Gemini API Client for Sentiment Analysis
async function callGeminiJudge(text) {
    if (!CONFIG.GEMINI_API_KEY) throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY');
    
    const prompt = [
        "คุณเป็นผู้เชี่ยวชาญการวิเคราะห์ความรู้สึกสำหรับโดเมนทุเรียนและผลไม้",
        "วิเคราะห์ข้อความต่อไปนี้และตอบในรูปแบบ JSON เท่านั้น:",
        "",
        "ข้อความ: " + text,
        "",
        "คำแนะนำการวิเคราะห์:",
        "- positive: อร่อย, หอม, หวาน, มัน, ดี, ชอบ, แนะนำ, คุ้มค่า, สด, คุณภาพดี",
        "- negative: ไม่อร่อย, เหม็น, เน่า, แย่, ไม่ชอบ, ไม่แนะนำ, ไม่คุ้ม, บูด, คุณภาพแย่",
        "- neutral: ข้อมูลทั่วไป, คำถาม, ไม่แสดงความรู้สึกชัดเจน",
        "",
        "รูปแบบ JSON:",
        '{"label":"positive|negative|neutral","confidence":0.0-1.0,"reason":"เหตุผลสั้นๆ","keywords":["คำสำคัญ1","คำสำคัญ2"]}'
    ].join("\n");
    
    const body = { 
        contents: [{role: "user", parts: [{text: prompt}]}], 
        generationConfig: { 
            temperature: 0.3, 
            maxOutputTokens: 256 
        } 
    };
    
    const res = await fetch(CONFIG.GEMINI_ENDPOINT, {
        method: "POST", 
        headers: { 
            "Content-Type": "application/json", 
            "x-goog-api-key": CONFIG.GEMINI_API_KEY 
        }, 
        body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error(`Gemini error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    
    // ตรวจสอบ response structure หลายแบบ
    let jsonStr = "";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        jsonStr = data.candidates[0].content.parts[0].text.trim();
    } else if (data?.candidates?.[0]?.content?.text) {
        jsonStr = data.candidates[0].content.text.trim();
    } else if (data?.candidates?.[0]?.text) {
        jsonStr = data.candidates[0].text.trim();
    }
    
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/```json|```/g,'').trim();
    
    // ลบข้อความที่ไม่ใช่ JSON
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }
    
    try {
        return JSON.parse(jsonStr);
    } catch (parseError) {
        console.error('Gemini Judge JSON Parse Error:', parseError);
        return { label: 'neutral', confidence: 0.5, reason: 'ไม่สามารถวิเคราะห์ได้', keywords: [] };
    }
}

// Utility function
function toThaiPolarity(p) { 
    if (!p) return 'เป็นกลาง'; 
    if (p === 'positive') return 'เชิงบวก'; 
    if (p === 'negative') return 'เชิงลบ'; 
    return 'เป็นกลาง'; 
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { callAIForthai, callGeminiCampaign, callGeminiJudge, toThaiPolarity };
}
