import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF导出服务
class PDFExportService {
  // 导出分析报告为PDF
  static async exportAnalysisReport(elementId: string, filename: string = '客服分析报告.pdf'): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('找不到要导出的元素');
      }

      // 配置html2canvas选项
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // 创建PDF文档
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4宽度
      const pageHeight = 295; // A4高度
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一页
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果内容超过一页，添加新页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 下载PDF
      pdf.save(filename);
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw new Error('PDF导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 导出简化版报告
  static async exportSimpleReport(data: any, filename: string = '客服分析报告.pdf'): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // 设置中文字体
      pdf.addFont('https://cdn.jsdelivr.net/npm/noto-sans-sc@1.0.1/NotoSansSC-Regular.otf', 'NotoSansSC', 'normal');
      pdf.setFont('NotoSansSC');

      let yPosition = 20;
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // 标题
      pdf.setFontSize(20);
      pdf.setFont('NotoSansSC', 'bold');
      pdf.text('1688客服聊天分析报告', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // 报告信息
      pdf.setFontSize(12);
      pdf.setFont('NotoSansSC', 'normal');
      pdf.text(`生成时间: ${data.report_metadata?.date || new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`分析客户数: ${data.report_metadata?.total_customers || 0}`, margin, yPosition);
      yPosition += 15;

      // 总体评分
      pdf.setFontSize(16);
      pdf.setFont('NotoSansSC', 'bold');
      pdf.text('执行摘要', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('NotoSansSC', 'normal');
      const overallScore = data.executive_summary?.overall_score || 0;
      pdf.text(`总体评分: ${overallScore}/100`, margin, yPosition);
      yPosition += 8;

      // 关键指标
      const metrics = data.executive_summary?.key_metrics;
      if (metrics) {
        pdf.text(`响应率: ${metrics.response_rate || 0}%`, margin, yPosition);
        yPosition += 6;
        pdf.text(`态度评分: ${metrics.attitude_score || 0}/100`, margin, yPosition);
        yPosition += 6;
        pdf.text(`销售技巧: ${metrics.sales_skills || 0}/100`, margin, yPosition);
        yPosition += 6;
        pdf.text(`谈判能力: ${metrics.negotiation_ability || 0}/100`, margin, yPosition);
        yPosition += 15;
      }

      // 主要问题
      pdf.setFontSize(16);
      pdf.setFont('NotoSansSC', 'bold');
      pdf.text('主要问题', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('NotoSansSC', 'normal');
      const issues = data.executive_summary?.top_issues || [];
      issues.forEach((issue: string, index: number) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${issue}`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // 客户分析
      pdf.setFontSize(16);
      pdf.setFont('NotoSansSC', 'bold');
      pdf.text('客户分析', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('NotoSansSC', 'normal');
      const customers = data.customer_analysis || [];
      customers.forEach((customer: any, index: number) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`客户 ${index + 1}: ${customer.customer_id || '未知'}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`评分: ${customer.score_breakdown?.overall || 0}/100`, margin + 10, yPosition);
        yPosition += 6;
        pdf.text(`摘要: ${customer.conversation_summary || '无'}`, margin + 10, yPosition);
        yPosition += 8;
      });

      // 行动方案
      pdf.setFontSize(16);
      pdf.setFont('NotoSansSC', 'bold');
      pdf.text('改进行动方案', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('NotoSansSC', 'normal');
      const actionPlan = data.action_plan;
      if (actionPlan) {
        // 立即行动
        pdf.setFontSize(14);
        pdf.setFont('NotoSansSC', 'bold');
        pdf.text('立即行动:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(12);
        pdf.setFont('NotoSansSC', 'normal');
        actionPlan.immediate?.forEach((action: string) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${action}`, margin + 10, yPosition);
          yPosition += 6;
        });
        yPosition += 5;

        // 短期计划
        pdf.setFontSize(14);
        pdf.setFont('NotoSansSC', 'bold');
        pdf.text('短期计划:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(12);
        pdf.setFont('NotoSansSC', 'normal');
        actionPlan.short_term?.forEach((action: string) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${action}`, margin + 10, yPosition);
          yPosition += 6;
        });
        yPosition += 5;

        // 长期规划
        pdf.setFontSize(14);
        pdf.setFont('NotoSansSC', 'bold');
        pdf.text('长期规划:', margin, yPosition);
        yPosition += 8;
        pdf.setFontSize(12);
        pdf.setFont('NotoSansSC', 'normal');
        actionPlan.long_term?.forEach((action: string) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${action}`, margin + 10, yPosition);
          yPosition += 6;
        });
      }

      // 下载PDF
      pdf.save(filename);
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw new Error('PDF导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

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
