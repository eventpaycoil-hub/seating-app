// app/api/whatsapp/templates/route.ts
import { NextResponse } from 'next/server';

const HEYY_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdkMGE1YTg4LTA4ZjItNDgxNS1hZmZlLTAxYmM5Y2JjNGYxMiIsImFwaUtleUlkIjoiMThiN2FhMmEtYjM2My00MDE1LTg4ZWQtMDAyMWU5ODZjNjgwIiwiaWF0IjoxNzg0MzUyMzkwfQ.PylW33Ko1T_PBKt8r0E0oKsMPgEXfNy08GGWWpqAH_0";

export async function POST() {
  try {
    const res = await fetch('https://api.heyy.io/v3/message_templates/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HEYY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "",
        sortBy: "createdAt",
        search: "",
      }),
    });

    const data = await res.json();

    // אם Heyy החזיר שגיאה - נחזיר אותה
    if (!res.ok) {
      console.error("Heyy Error:", data);
      return NextResponse.json(
        { success: false, error: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'שגיאה פנימית' },
      { status: 500 }
    );
  }
}