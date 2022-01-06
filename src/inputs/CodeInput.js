import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-html'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-css'
import 'ace-builds/src-noconflict/mode-markdown'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

export const CodeInput = ({ onChange, value, className = '', readOnly, theme = 'monokai', mode = 'javascript' }) => {
  return (
    <AceEditor
      className={className}
      readOnly={readOnly}
      style={{zIndex: 0, isolation: 'isolate'}}
      mode={mode}
      theme={theme}
      onChange={onChange}
      value={value}
      name="scriptParam"
      editorProps={{ $blockScrolling: true }}
      height="300px"
      width="100%"
      showGutter={true}
      tabSize={2}
      highlightActiveLine={true}
      enableBasicAutocompletion={true}
      enableLiveAutocompletion={true}
    />
  );

}
