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

export const SingleLineCode = ({ onChange, value, className = '', readOnly, theme = 'monokai', mode = 'javascript', ...props }) => {
    return (
        <div style={{ padding: '6px', backgroundColor: theme === 'monokai' ? "#272822" : '#fff', flex: 1 }}>
            <AceEditor
                commands={Beautify.commands}
                className={className}
                readOnly={readOnly}
                style={{
                    zIndex: 0,
                    isolation: 'isolate'
                }}
                width="-1"
                mode={mode}
                theme={theme}
                onChange={onChange}
                value={value}
                name="scriptParam"
                setOptions={{
                    maxLines: 1,
                    fontSize: '15px'
                }}
                editorProps={{
                    $blockScrolling: true
                }}
                showGutter={false}
                highlightActiveLine={false}
                enableBasicAutocompletion={true}
                enableLiveAutocompletion={true}
                ref={props.setRef}
                {...props}
            />
        </div>
    );

}
