// 创建一个新的 Docsify 插件来处理游戏平台统计
(function() {
  // 等待 Docsify 完全加载
  window.$docsify = window.$docsify || {};
  
  // 添加一个钩子，在页面渲染后执行
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      // 只在游戏页面执行
      if (window.location.hash.indexOf('#/game/') !== -1) {
        setTimeout(generatePlatformChart, 500);
      }
    });
  });

  function generatePlatformChart() {
    // 查找图表容器
    const chartContainer = document.getElementById('platform-chart-container');
    if (!chartContainer) return;

    // 建立平台统计对象
    const platforms = {};
    const platformNames = {
      'si-steam': 'Steam',
      'si-steamdeck': 'Steam Deck',
      'si-nintendoswitch': 'Nintendo Switch',
      'si-nintendo3ds': '3DS',
      'si-wiiu': 'WiiU',
      'si-playstation2': 'PS2',
      'si-playstation3': 'PS3',
      'si-playstationvita': 'PS Vita',
      'si-playstation4': 'PS4',
      'si-playstation5': 'PS5',
      'si-xbox': 'Xbox',
      'si-meta': 'Meta Quest'
    };
    
    // 平台对应的配色
    const platformColors = {
      'Steam': '#333333',
      'Steam Deck': '#1A1A1A',
      'Nintendo Switch': '#E60012',
      '3DS': '#FF6666',
      'Wii U': '#CC0000',
      'PS2': '#003791',
      'PS3': '#0070D1',
      'PS Vita': '#003087',
      'PS4': '#2E6DB4',
      'PS5': '#006FCD',
      'Xbox': '#107C10',
      'Meta Quest': '#ECECEC'
    };

    // 获取表格之后的内容，即实际游戏列表部分
    const tableElement = document.querySelector('table');
    if (!tableElement) return;
    
    // 找到实际游戏列表的开始位置
    let gameListContainer = document.querySelector('.markdown-section');
    if (!gameListContainer) return;
    
    // 找到所有游戏项中的图标
    // 我们使用"Date | Name | Comment"这一行后面的所有.si元素
    const headingRowElements = Array.from(document.querySelectorAll('tr'));
    const headingRow = headingRowElements.find(row => 
      row.textContent.includes('Date') && 
      row.textContent.includes('Name') && 
      row.textContent.includes('Comment')
    );
    
    if (!headingRow) return;
    
    // 获取所有实际游戏记录中的图标（表格中的）
    const gameIcons = [];
    let currentElement = headingRow.parentElement.parentElement; // 获取table元素
    
    // 收集表格中的图标
    const tableIcons = currentElement.querySelectorAll('td .si');
    gameIcons.push(...tableIcons);
    
    // 如果没有找到足够的图标，尝试所有H3标题下的内容
    if (gameIcons.length < 10) {
      const yearHeadings = document.querySelectorAll('h3');
      yearHeadings.forEach(heading => {
        // 找到下一个heading之前的所有内容
        let nextElement = heading.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H3') {
          const icons = nextElement.querySelectorAll('.si');
          gameIcons.push(...icons);
          nextElement = nextElement.nextElementSibling;
        }
      });
    }
    
    // 过滤掉顶部图例中的图标
    const platformTableRow = document.querySelector('tbody tr:first-child');
    const legendIcons = platformTableRow ? Array.from(platformTableRow.querySelectorAll('.si')) : [];
    const legendIconClasses = legendIcons.map(icon => {
      return Array.from(icon.classList).find(cls => cls.startsWith('si-'));
    });

    // 统计每个平台的出现次数
    gameIcons.forEach(icon => {
      // 获取平台类名，例如 "si si-steam"
      const classList = Array.from(icon.classList);
      const platformClass = classList.find(cls => cls.startsWith('si-'));
      
      if (platformClass && platformNames[platformClass]) {
        const platformName = platformNames[platformClass];
        platforms[platformName] = (platforms[platformName] || 0) + 1;
      }
    });

    // 如果没有数据，不生成图表
    if (Object.keys(platforms).length === 0) return;

    // 准备图表数据
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    // 对平台按照数量排序
    Object.entries(platforms)
      .sort((a, b) => b[1] - a[1])
      .forEach((entry) => {
        const platformName = entry[0];
        labels.push(platformName);
        data.push(entry[1]);
        backgroundColors.push(platformColors[platformName] || '#999999');
      });

    // 创建图表
    const ctx = document.createElement('canvas');
    ctx.id = 'platformChart';
    ctx.style.width = '100%';
    ctx.style.maxHeight = '300px';
    ctx.style.margin = '0 auto';

    // 创建图表布局容器
    const chartLayoutContainer = document.createElement('div');
    chartLayoutContainer.style.display = 'flex';
    chartLayoutContainer.style.flexDirection = 'column';
    chartLayoutContainer.style.alignItems = 'center';
    chartLayoutContainer.style.width = '100%';
    chartLayoutContainer.style.marginBottom = '20px';
    
    // 饼图容器
    const chartInnerContainer = document.createElement('div');
    chartInnerContainer.style.width = '100%';
    chartInnerContainer.style.maxWidth = '400px';
    chartInnerContainer.appendChild(ctx);
    
    // 在图表旁添加带图标的图例
    const legendContainer = document.createElement('div');
    legendContainer.style.display = 'flex';
    legendContainer.style.flexWrap = 'wrap';
    legendContainer.style.justifyContent = 'center';
    legendContainer.style.margin = '10px auto';
    legendContainer.style.maxWidth = '600px';
    
    // 为每个平台创建图例项
    labels.forEach((platformName, index) => {
      const legendItem = document.createElement('div');
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.margin = '5px';
      legendItem.style.padding = '4px 8px';
      legendItem.style.borderRadius = '4px';
      legendItem.style.backgroundColor = 'rgba(0,0,0,0.05)';
      legendItem.style.minWidth = '120px'; // 设置最小宽度确保布局整齐
      
      // 获取平台对应的图标类
      const iconClass = Object.entries(platformNames).find(
        ([key, value]) => value === platformName
      )?.[0];
      
      // 添加色块样式
      const colorBlock = document.createElement('span');
      colorBlock.style.display = 'inline-block';
      colorBlock.style.width = '12px';
      colorBlock.style.height = '12px';
      colorBlock.style.backgroundColor = backgroundColors[index];
      colorBlock.style.marginRight = '6px';
      colorBlock.style.borderRadius = '2px';
      
      // 创建图标元素
      const icon = document.createElement('i');
      icon.className = `si ${iconClass}`;
      icon.style.marginRight = '6px';
      icon.style.color = platformColors[platformName];
      icon.style.fontSize = '1.2em';
      
      // 创建文本元素
      const text = document.createElement('span');
      text.textContent = `${platformName}: ${data[index]}`;
      text.style.fontFamily = 'LXGW WenKai GB Screen, sans-serif';
      text.style.fontSize = '0.9em';
      
      // 将图标和文本添加到图例项
      legendItem.appendChild(colorBlock);
      legendItem.appendChild(icon);
      legendItem.appendChild(text);
      
      // 为图例项添加点击事件，实现与图表的交互
      legendItem.style.cursor = 'pointer';
      legendItem.dataset.index = index;
      legendItem.addEventListener('click', function() {
        const chart = Chart.getChart(ctx);
        const index = parseInt(this.dataset.index);
        if (chart) {
          chart.toggleDataVisibility(index);
          chart.update();
          
          // 更新图例项的视觉样式
          if (chart.getDataVisibility(index)) {
            this.style.opacity = '1';
          } else {
            this.style.opacity = '0.5';
          }
        }
      });
      
      // 将图例项添加到图例容器
      legendContainer.appendChild(legendItem);
    });
    
    // 标题（移至底部）
    const titleElement = document.createElement('h3');
    titleElement.textContent = '游戏平台分布';
    titleElement.style.textAlign = 'center';
    titleElement.style.fontFamily = 'LXGW WenKai GB Screen, sans-serif';
    titleElement.style.marginTop = '15px';
    titleElement.style.marginBottom = '0';
    
    // 清空容器
    chartContainer.innerHTML = '';
    
    // 添加到布局容器
    chartLayoutContainer.appendChild(chartInnerContainer);
    chartLayoutContainer.appendChild(legendContainer);
    chartLayoutContainer.appendChild(titleElement);
    
    // 将整个布局添加到图表容器
    chartContainer.appendChild(chartLayoutContainer);
    
    // 创建图表
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: '游戏数量',
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // 隐藏默认图例
          },
          title: {
            display: false // 隐藏默认标题
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
})();