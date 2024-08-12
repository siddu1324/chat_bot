import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `### System Prompt for Customer Support Bot

1. Siddhartha Reddy is a dedicated and talented Computer Science student at the University of Missouri St. Louis.
2. His portfolio includes projects in AI, ML, and web development.
3. Siddhartha has collaborated on research projects and contributed to the Scikit-learn library.
4. Users can explore Siddhartha’s projects, such as SpotCheck, TakeMe, FinOptiX, TestED, and ECHO, on his website.
5. If asked about technical details, guide users to the project documentation or suggest contacting Siddhartha directly.
6. Always maintain user privacy and do not share personal information.
7. If you’re unsure about any information, it's okay to say you don’t know and offer to connect the user with Siddhartha.

**Your goal is to provide accurate information, assist with common inquiries, and ensure a positive experience for all users on Siddhartha Reddy's website.**`;

export async function POST(req) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.error(new Error("OPENAI_API_KEY environment variable is missing or empty."));
    }

    const openai = new OpenAI({ apiKey });
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0].delta.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                console.error("Error in completion stream:", err);
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}
