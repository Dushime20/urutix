import React, { useState } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';

export const CommunicationPanel = ({ tripId, driver }: any) => {
  const [message, setMessage] = useState('');
  const handleSend = () => {
    // Implement send logic (API call)
    alert(`Message sent to driver: ${message}`);
    setMessage('');
  };
  return (
    <div className="mb-4 p-2 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Communication</h2>
      <div className="flex gap-2 items-center mb-2">
        <FaEnvelope className="text-blue-600" />
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="Send message to driver..."
          value={message}
          onChange={e=>setMessage(e.target.value)}
          aria-label="Message to driver"
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSend}>Send</button>
      </div>
      <div className="flex gap-2 items-center">
        <FaPhone className="text-green-600" />
        <span>Call: <a href={`tel:${driver?.phone}`} className="underline">{driver?.phone}</a></span>
      </div>
    </div>
  );
};
