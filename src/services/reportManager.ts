import { AnalysisResult } from '../types';

// 报告记录接口
export interface ReportRecord {
  id: string;
  title: string;
  date: string;
  fileName: string;
  result: AnalysisResult;
  config: any;
  createdAt: string;
  updatedAt: string;
}

// 报告管理服务
class ReportManager {
  private static instance: ReportManager;
  private readonly STORAGE_KEY = 'ai_analysis_reports';

  constructor() {}

  static getInstance(): ReportManager {
    if (!ReportManager.instance) {
      ReportManager.instance = new ReportManager();
    }
    return ReportManager.instance;
  }

  // 保存报告
  async saveReport(result: AnalysisResult, fileName: string, config: any): Promise<string> {
    try {
      const reports = await this.loadReports();
      const reportId = this.generateReportId();
      
      const report: ReportRecord = {
        id: reportId,
        title: result.report_metadata.title,
        date: result.report_metadata.date,
        fileName: fileName,
        result: result,
        config: config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      reports.unshift(report); // 添加到开头
      
      // 限制保存的报告数量（最多保存50个）
      if (reports.length > 50) {
        reports.splice(50);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
      return reportId;
    } catch (error) {
      console.error('保存报告失败:', error);
      throw new Error('保存报告失败');
    }
  }

  // 加载所有报告
  async loadReports(): Promise<ReportRecord[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('加载报告失败:', error);
      return [];
    }
  }

  // 获取单个报告
  async getReport(reportId: string): Promise<ReportRecord | null> {
    try {
      const reports = await this.loadReports();
      return reports.find(report => report.id === reportId) || null;
    } catch (error) {
      console.error('获取报告失败:', error);
      return null;
    }
  }

  // 删除报告
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const reports = await this.loadReports();
      const filteredReports = reports.filter(report => report.id !== reportId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredReports));
      return true;
    } catch (error) {
      console.error('删除报告失败:', error);
      return false;
    }
  }

  // 清空所有报告
  async clearAllReports(): Promise<boolean> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清空报告失败:', error);
      return false;
    }
  }

  // 搜索报告
  async searchReports(keyword: string): Promise<ReportRecord[]> {
    try {
      const reports = await this.loadReports();
      if (!keyword.trim()) return reports;

      const lowerKeyword = keyword.toLowerCase();
      return reports.filter(report => 
        report.title.toLowerCase().includes(lowerKeyword) ||
        report.fileName.toLowerCase().includes(lowerKeyword) ||
        report.date.includes(keyword)
      );
    } catch (error) {
      console.error('搜索报告失败:', error);
      return [];
    }
  }

  // 按日期筛选报告
  async filterReportsByDate(startDate: string, endDate: string): Promise<ReportRecord[]> {
    try {
      const reports = await this.loadReports();
      return reports.filter(report => {
        const reportDate = new Date(report.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return reportDate >= start && reportDate <= end;
      });
    } catch (error) {
      console.error('按日期筛选报告失败:', error);
      return [];
    }
  }

  // 获取报告统计信息
  async getReportStats(): Promise<{
    total: number;
    thisMonth: number;
    thisWeek: number;
    averageScore: number;
  }> {
    try {
      const reports = await this.loadReports();
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const thisMonthReports = reports.filter(report => 
        new Date(report.createdAt) >= thisMonth
      );
      
      const thisWeekReports = reports.filter(report => 
        new Date(report.createdAt) >= thisWeek
      );

      const totalScore = reports.reduce((sum, report) => 
        sum + report.result.executive_summary.overall_score, 0
      );
      const averageScore = reports.length > 0 ? totalScore / reports.length : 0;

      return {
        total: reports.length,
        thisMonth: thisMonthReports.length,
        thisWeek: thisWeekReports.length,
        averageScore: Math.round(averageScore)
      };
    } catch (error) {
      console.error('获取报告统计失败:', error);
      return {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        averageScore: 0
      };
    }
  }

  // 导出报告数据
  async exportReports(): Promise<string> {
    try {
      const reports = await this.loadReports();
      const exportData = {
        exportDate: new Date().toISOString(),
        totalReports: reports.length,
        reports: reports
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出报告失败:', error);
      throw new Error('导出报告失败');
    }
  }

  // 导入报告数据
  async importReports(data: string): Promise<boolean> {
    try {
      const importData = JSON.parse(data);
      if (!importData.reports || !Array.isArray(importData.reports)) {
        throw new Error('无效的报告数据格式');
      }

      const existingReports = await this.loadReports();
      const newReports = importData.reports.filter((report: ReportRecord) => 
        !existingReports.find(existing => existing.id === report.id)
      );

      const allReports = [...existingReports, ...newReports];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allReports));
      
      return true;
    } catch (error) {
      console.error('导入报告失败:', error);
      return false;
    }
  }

  // 生成报告ID
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出实例
export const reportManager = ReportManager.getInstance();
export default ReportManager;
