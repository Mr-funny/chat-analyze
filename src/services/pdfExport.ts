import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF导出服务
class PDFExportService {
  // 导出完整的、所见即所得的报告
  static async exportFullReport(elementId: string, filename: string = '客服分析报告.pdf'): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`找不到ID为 "${elementId}" 的元素进行导出`);
      }

      // 为了更好的截图效果，临时增加背景色
      element.style.backgroundColor = 'white';

      // 控制渲染比例，避免超大画布；2x 在清晰度与体积间较均衡
      const scale = 2;
      const captureOptions: any = {
        useCORS: true,
        allowTaint: true,
        scale,
        width: element.clientWidth,
        height: element.scrollHeight,
      };
      const canvas = await html2canvas(element, captureOptions as any);

      element.style.backgroundColor = ''; // 恢复原始背景色

      // 启用压缩，单位毫米，A4 纵向
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // 根据A4比例在画布坐标系下计算单页高度（像素）
      // 稍微缩短每页高度，降低切到组件边框的概率
      const pageHeightPx = Math.floor((pdfHeight / pdfWidth) * canvas.width) - 4;
      let currentPageTopPx = 0;
      // 为避免分页间出现细微缝隙，加入1-2px重叠
      // 放大重叠高度，保证不同板块不被切割
      const overlapPx = 8;
      // 统一像素到毫米的缩放比例（按宽度等比）
      const scalePxToMm = pdfWidth / canvas.width;

      // 使用切片方式分页，避免整张大图重复插入导致体积暴涨与截断
      while (currentPageTopPx < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - currentPageTopPx);

        // 创建临时canvas承载当页图像
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        if (!pageCtx) break;
        pageCtx.drawImage(
          canvas,
          0,
          currentPageTopPx,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        // 使用JPEG并设置压缩质量，极大降低文件体积
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.82);

        // 以等比缩放适配A4宽度，并做统一取整，避免浮点误差
        const imgPdfWidth = pdfWidth;
        const imgPdfHeightRaw = sliceHeight * scalePxToMm;
        const imgPdfHeight = Math.round(imgPdfHeightRaw * 100) / 100; // 保留2位小数

        if (currentPageTopPx > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, imgPdfWidth, imgPdfHeight);

        // 下一页从当前切片的末端减去重叠像素开始，避免缝隙
        currentPageTopPx += sliceHeight - overlapPx;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw new Error('PDF导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 废弃旧的 simple report 方法
  /*
  static async exportSimpleReport(data: any, filename: string = '客服分析报告.pdf'): Promise<void> {
    // ... code ...
  }
  */

  // 检查浏览器兼容性
  static checkCompatibility(): { supported: boolean; message: string } {
    const canvas = document.createElement('canvas');
    const isCanvasSupported = !!(canvas.getContext && canvas.getContext('2d'));
    
    if (!isCanvasSupported) {
      return {
        supported: false,
        message: '浏览器不支持Canvas，无法生成PDF'
      };
    }

    return {
      supported: true,
      message: '浏览器支持PDF导出'
    };
  }
}

export default PDFExportService;
