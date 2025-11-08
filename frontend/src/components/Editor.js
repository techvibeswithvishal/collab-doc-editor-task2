import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const SAVE_INTERVAL_MS = 2000;

export default function Editor() {
  const { id: documentId } = useParams();
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const saveIntervalRef = useRef(null);

  useEffect(() => {
    // connect to backend
    socketRef.current = io('http://localhost:5000');

    // request document
    socketRef.current.emit('get-document', documentId);

    // when document loaded from server
    socketRef.current.on('load-document', (data) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = data || '';
        editorRef.current.removeAttribute('contenteditable');
        // enable after loading
        setTimeout(() => editorRef.current.setAttribute('contenteditable', true), 50);
      }
    });

    // receive remote changes
    socketRef.current.on('receive-changes', (data) => {
      // don't overwrite while user is typing (if focused)
      if (document.activeElement === editorRef.current) return;
      if (editorRef.current) editorRef.current.innerHTML = data;
    });

    // send save periodically
    saveIntervalRef.current = setInterval(() => {
      if (!socketRef.current || !editorRef.current) return;
      socketRef.current.emit('save-document', editorRef.current.innerHTML);
    }, SAVE_INTERVAL_MS);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(saveIntervalRef.current);
    };
  }, [documentId]);

  // send changes on each keystroke
  const handleInput = (e) => {
    const html = e.target.innerHTML;
    if (socketRef.current) {
      socketRef.current.emit('send-changes', html);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Collaborative Editor (Document: {documentId})</h2>
      <div
        ref={editorRef}
        id="editor"
        onInput={handleInput}
        style={{
          minHeight: '60vh',
          border: '1px solid #ddd',
          padding: 12,
          borderRadius: 6,
          outline: 'none'
        }}
      />
      <p style={{ color: '#666', marginTop: 8 }}>Automatically saves every 2 seconds.</p>
    </div>
  );
}
