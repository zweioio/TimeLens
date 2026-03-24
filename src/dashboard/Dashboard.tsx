import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-800">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-2xl w-full text-center">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-3xl font-bold mb-4 text-gray-900">TimeLens 仪表盘</h1>
        <p className="text-gray-500 mb-8">完整的数据统计和多维趋势分析（即将推出）</p>
        <div className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
          功能开发中...
        </div>
      </div>
    </div>
  );
};

export default Dashboard;