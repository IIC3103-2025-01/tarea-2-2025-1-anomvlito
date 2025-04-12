import React from "react";

const Chat = () => {
  return (
    <div className="panel">
      <h2>Chat con Satélites</h2>
      <div className="chat-log">
        {/* Aquí se mostrarían los mensajes; por ahora un mensaje dummy */}
        <p>
          <strong>NRO-002:</strong> Hello, Earth!
        </p>
      </div>
      <div className="chat-input">
        <input type="text" placeholder="Escribe un mensaje..." />
        <button>Enviar</button>
      </div>
    </div>
  );
};

export default Chat;
