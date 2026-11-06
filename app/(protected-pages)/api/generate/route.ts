import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import path from 'path';
import fs from 'fs';


export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {


    // ── Parse request body ───────────────────────────────────────────────────
    const { html, type, fileName } = await req.json();

    if (!html || !type || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: html, type, fileName" },
        { status: 400 }
      );
    }

    // ── Build full HTML ──────────────────────────────────────────────────────
    const cssPath = path.join(process.cwd(), 'app', 'globals.css');
    const cssContent = fs.existsSync(cssPath)
      ? fs.readFileSync(cssPath, 'utf8')
      : '';

    const fullHtml = `
      <!DOCTYPE html>
      <html class="">
        <head>
          <meta charset="UTF-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            ${cssContent}
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #receipt-capture-area {
              display: inline-block;
              min-width: 400px;
              background: white;
            }
            .dark #receipt-wrapper {
              background: #0f172a;
            }
            .grid > div {
              break-inside: avoid;
        }
          </style>
        </head>
        <body>
          <div id="receipt-wrapper">${html}</div>
        </body>
      </html>
    `;

    // ── Launch Puppeteer ─────────────────────────────────────────────────────
    const isLocal = process.env.NODE_ENV === 'development';

    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: isLocal
        ? process.env.CHROME_PATH ||
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'),
      headless: true,
    });

    const page = await browser.newPage();

    await page.emulateMediaType('screen');
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    // ── Generate output ──────────────────────────────────────────────────────
    let buffer: Uint8Array;

    if (type === 'pdf') {
      buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
      });
    } else {
      const element = await page.$('#receipt-capture-area');
      if (!element) throw new Error("Capture area not found");
      buffer = await element.screenshot({
        type: 'png',
        omitBackground: true,
      }) as Uint8Array;
    }

    await browser.close();

    // ── Return file ──────────────────────────────────────────────────────────
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': type === 'pdf' ? 'application/pdf' : 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Puppeteer error:', error);
    return NextResponse.json(
      { error: 'Generation failed. Please try again.' },
      { status: 500 }
    );
  }
}