import React from 'react';
import AceEditor from 'react-ace';

import Beautify from 'brace/ext/beautify'
import 'brace/mode/html'
import 'brace/mode/javascript'
import 'brace/mode/json'
import 'brace/mode/css'
import 'brace/mode/markdown'
import 'brace/theme/monokai'
import 'brace/theme/tomorrow'
import 'brace/ext/searchbox'
import 'brace/ext/language_tools';

export const CodeInput = ({ onChange, value, className = '', readOnly, theme = 'monokai', mode = 'javascript', ...props }) => {
  return (
    <AceEditor
      commands={Beautify.commands}
      className={className}
      readOnly={readOnly}
      style={{zIndex: 0, isolation: 'isolate'}}
      mode={mode}
      theme={theme}
      onChange={onChange}
      value={value}
      name="scriptParam"
      editorProps={{ $blockScrolling: true }}
      onLoad={editorInstance => { 

        editorInstance.container.style.resize = "both";
        // mouseup = css resize end
        document.addEventListener("mouseup", e => (
          editorInstance.resize()
        ));
      }}
      height={props.height}
      width={props.width}
      showGutter={true}
      tabSize={2}
      highlightActiveLine={true}
      enableBasicAutocompletion={true}
      enableLiveAutocompletion={true}
      {...props}
      ref={props.setRef}
    />
  );

}
