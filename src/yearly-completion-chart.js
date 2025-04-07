// 创建一个新的 Docsify 插件来处理按年份的游戏通关统计
(function() {
  // 等待 Docsify 完全加载
  window.$docsify = window.$docsify || {};
  
  // 添加一个钩子，在页面渲染后执行
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      // 只在游戏页面执行
      if (window.location.hash.indexOf('#/game/') !== -1) {
        setTimeout(generateYearlyCompletionChart, 500);
      }
    });
  });

  function generateYearlyCompletionChart() {
    // 查找图表容器
    const chartContainer = document.getElementById('yearly-chart-container');
    if (!chartContainer) return;
    
    // 查找所有年份标题
    const yearHeadings = Array.from(document.querySelectorAll('h3'));
    if (!yearHeadings || yearHeadings.length === 0) return;
    
    // 收集年份数据
    const yearlyData = {};
    
    yearHeadings.forEach(heading => {
      const yearText = heading.textContent.trim();
      // 排除非年份标题
      if (!/^\d{4}(-\d{4})?$/.test(yearText)) return;
      
      // 找到该年份下的所有游戏表格行
      let tableRows = [];
      let nextElement = heading.nextElementSibling;
      
      // 寻找紧跟在标题后的表格
      while (nextElement && nextElement.tagName !== 'H3') {
        if (nextElement.tagName === 'TABLE') {
          const rows = nextElement.querySelectorAll('tbody tr');
          tableRows.push(...rows);
        }
        nextElement = nextElement.nextElementSibling;
      }
      
      // 统计该年份的游戏数量
      yearlyData[yearText] = tableRows.length;
    });
    
    // 如果没有数据，不生成图表
    if (Object.keys(yearlyData).length === 0) return;
    
    // 按照年份顺序排序
    const sortedYears = Object.keys(yearlyData).sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      return yearA - yearB;
    });
    
    const sortedData = sortedYears.map(year => yearlyData[year]);
    
    // 创建图表
    const ctx = document.createElement('canvas');
    ctx.id = 'yearlyCompletionChart';
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
    chartLayoutContainer.style.marginTop = '20px';
    
    // 图表容器
    const chartInnerContainer = document.createElement('div');
    chartInnerContainer.style.width = '100%';
    chartInnerContainer.style.maxWidth = '600px';
    chartInnerContainer.appendChild(ctx);
    
    // 标题（底部）
    const titleElement = document.createElement('h3');
    titleElement.textContent = '按年份统计的游戏通关数量';
    titleElement.style.textAlign = 'center';
    titleElement.style.fontFamily = 'LXGW WenKai GB Screen, sans-serif';
    titleElement.style.marginTop = '15px';
    titleElement.style.marginBottom = '0';
    
    // 清空容器
    chartContainer.innerHTML = '';
    
    // 添加到布局容器
    chartLayoutContainer.appendChild(chartInnerContainer);
    chartLayoutContainer.appendChild(titleElement);
    
    // 将整个布局添加到图表容器
    chartContainer.appendChild(chartLayoutContainer);
    
    // 创建图表
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedYears,
        datasets: [{
          label: '通关游戏数量',
          data: sortedData,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#2196F3',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            title: {
              display: true,
              text: '游戏数量',
              font: {
                family: 'LXGW WenKai GB Screen, sans-serif'
              }
            }
          },
          x: {
            title: {
              display: true,
              text: '年份',
              font: {
                family: 'LXGW WenKai GB Screen, sans-serif'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'LXGW WenKai GB Screen, sans-serif'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `通关数量: ${context.parsed.y}`;
              }
            }
          }
        }
      }
    });
  }
})();
