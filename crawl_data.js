import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--use-fake-ui-for-media-stream"],
  });

  const page = await browser.newPage();

  await page.goto("https://saigontourist.net/vi/tour/tour-phu-quoc", {
    waitUntil: "networkidle2",
  });

  // Cuộn xuống để tải thêm nội dung nếu trang có lazy load
  let previousHeight;
  while (true) {
    previousHeight = await page.evaluate("document.body.scrollHeight");
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1000);
    const currentHeight = await page.evaluate("document.body.scrollHeight");
    if (currentHeight === previousHeight) break;
  }

  // Lấy toàn bộ tiêu đề các tour
  const data = await page.evaluate(() => {
    const titleElements = document.querySelectorAll(
      'a[data-category][data-name][class*="GAproductClick"]'
    );
    const titles = Array.from(titleElements).map((el) =>
      el.innerText.trim()
    );
    return { titles };
  });

  console.log(data);

  await browser.close();
})();
