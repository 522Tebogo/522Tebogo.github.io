document.addEventListener('DOMContentLoaded', () => {
  const tagcloudContainer = document.querySelector('.tagcloud');

  if (tagcloudContainer) {
    const links = tagcloudContainer.querySelectorAll('a');

    // --- 颜色生成函数 (生成协调的文字和边框颜色) ---
    function getRandomCoordinatedDarkColors() {
      const minVal = 50; // 略微提高最小值，避免纯黑
      const maxVal = 130; // 保持在暗色范围

      // 生成一个基础的随机暗色
      const baseR = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      const baseG = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      const baseB = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

      // 为文字颜色增加一些活力
      const dominantComponent = Math.floor(Math.random() * 3);
      let textR = baseR, textG = baseG, textB = baseB;
      const textBoost = 40;

      if (dominantComponent === 0) textR = Math.min(200, baseR + textBoost);
      else if (dominantComponent === 1) textG = Math.min(200, baseG + textBoost);
      else textB = Math.min(200, baseB + textBoost);

      const textColor = `rgb(${textR}, ${textG}, ${textB})`;

      // 为边框颜色生成一个与文字颜色相关的颜色
      // 这里我们让边框颜色在基础颜色的基础上稍微暗一些
      const borderOffset = 40;
      const borderR = Math.max(10, baseR - borderOffset + Math.floor(Math.random() * (borderOffset * 0.5))); // 保证不会太亮或太暗
      const borderG = Math.max(10, baseG - borderOffset + Math.floor(Math.random() * (borderOffset * 0.5)));
      const borderB = Math.max(10, baseB - borderOffset + Math.floor(Math.random() * (borderOffset * 0.5)));

      const borderColor = `rgb(${borderR}, ${borderG}, ${borderB})`;

      return { textColor, borderColor };
    }

    // 设置所有标签的初始颜色和边框颜色
    links.forEach(link => {
      const colors = getRandomCoordinatedDarkColors();
      link.style.color = colors.textColor;
      link.style.borderColor = colors.borderColor;
    });

    // 定期改变颜色
    setInterval(() => {
      links.forEach(link => {
        const colors = getRandomCoordinatedDarkColors();
        link.style.color = colors.textColor;
        link.style.borderColor = colors.borderColor;
      });
    }, 3000); // 颜色变化周期

    // --- 随机定位带防重叠 (与之前相同) ---
    function positionTagsRandomly() {
      const containerRect = tagcloudContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      let placedTags = [];

      links.forEach(link => {
        const linkWidth = link.offsetWidth;
        const linkHeight = link.offsetHeight;

        const maxAttempts = 50;
        let attempts = 0;
        let isOverlapping = true;
        let newLeft, newTop;

        while (isOverlapping && attempts < maxAttempts) {
          newLeft = Math.max(0, Math.floor(Math.random() * (containerWidth - linkWidth)));
          newTop = Math.max(0, Math.floor(Math.random() * (containerHeight - linkHeight)));

          isOverlapping = placedTags.some(placedRect => {
            return newLeft < placedRect.right &&
                   newLeft + linkWidth > placedRect.left &&
                   newTop < placedRect.bottom &&
                   newTop + linkHeight > placedRect.top;
          });

          attempts++;
        }

        link.style.left = `${newLeft}px`;
        link.style.top = `${newTop}px`;

        placedTags.push({
          left: newLeft,
          top: newTop,
          right: newLeft + linkWidth,
          bottom: newTop + linkHeight
        });
      });
    }

    // --- 定位触发器 (与之前相同) ---
    setTimeout(positionTagsRandomly, 100);
    setInterval(positionTagsRandomly, 5000);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        positionTagsRandomly();
      }, 250);
    });
  }
});