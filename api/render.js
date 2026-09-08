const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

// نسخة Chromium محسّنة لبيئة Serverless — بتتنزل وقت التشغيل، مش جزء من حجم الكود
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // حماية بسيطة عشان محدش تاني يستخدم الخدمة غيرك (مش موضوع فلوس، بس أمان)
  const expectedKey = process.env.RENDER_API_KEY || '';
  if (expectedKey && req.headers['x-api-key'] !== expectedKey) {
    res.status(401).json({ error: 'مفتاح غير صحيح' });
    return;
  }

  const { url } = req.body || {};
  if (!url) {
    res.status(400).json({ error: 'الرابط (url) مطلوب' });
    return;
  }

  let browser;
  try {
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
    const html = await page.content();

    res.status(200).json({ html });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};