// Chat.jsx
import React, { useState } from "react";

const Chat = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="panel chat-panel">
      <h2>Chat con Satélites</h2>
      <div className="chat-log">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`chat-message ${msg.direction}`}
            style={{ color: msg.level === 'warn' ? 'red' : 'inherit' }}
          >
            <span className="timestamp">
              {msg.timestamp.toLocaleTimeString()}
            </span>{" "}
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default Chat;
