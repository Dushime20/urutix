import React from 'react';
import { TranslatedText } from '../../components/translated-text';

const MonitoringDashboard: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4"><TranslatedText text="System Monitoring Dashboard" /></h1>
            <p className="text-gray-600"><TranslatedText text="Monitoring features coming soon..." /></p>
        </div>
    );
};

export default MonitoringDashboard;
