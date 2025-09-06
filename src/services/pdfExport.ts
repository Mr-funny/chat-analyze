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

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        // 使用 width/height 替代不兼容的 windowWidth/windowHeight
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      element.style.backgroundColor = ''; // 恢复原始背景色

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = imgWidth / imgHeight;
      const canvasPdfWidth = pdfWidth;
      const canvasPdfHeight = canvasPdfWidth / ratio;

      let position = 0;
      let heightLeft = canvasPdfHeight;

      pdf.addImage(canvas, 'PNG', 0, position, canvasPdfWidth, canvasPdfHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, canvasPdfWidth, canvasPdfHeight);
        heightLeft -= pdfHeight;
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
