import React, { useState, useEffect } from 'react';
import showdown from 'showdown';
import AceEditor from 'react-ace';
import classNames from 'classnames';

import '@fortawesome/fontawesome-free/css/all.css';
import 'highlight.js/styles/monokai.css';

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

import hljs from 'highlight.js';
window.hljs = window.hljs || hljs;

const DaikokuExtension = () => {
  // @ref:[]()
  const refextension = {
    type: 'lang',
    regex: /@ref:\[(.*)\]\((.*)\)/g,
    replace: (expression, title, docId) => {
      const path = window.location.pathname;
      const rawParts = path.split('/');
      rawParts.shift();
      const parts = rawParts.splice(0, 5);
      const teamId = parts[1];
      const apiId = parts[3];
      const versionId = parts[4];
      return `<a href="/${teamId}/${apiId}/${versionId}/documentation/${docId}">${title}</a>`;
    },
  };
  // @@@
  const tripleArobase = {
    type: 'lang',
    regex: /@@@/g,
    replace: () => {
      // console.log('@@@');
      return '</div>';
    },
  };
  // @@@ warning
  const warningExtension = {
    type: 'lang',
    regex: /@@@ warning/g,
    replace: () => {
      return '<div class="note note-warning">';
    },
  };
  // @@@ warning { title= }
  const warningTitleExtension = {
    type: 'lang',
    regex: /@@@ warning \{ title='(.*)' \}/g,
    replace: (expr, title) => {
      return `<div class="note note-warning"><div class="note-title">${title}</div>`;
    },
  };
  // @@@ note
  const noteExtension = {
    type: 'lang',
    regex: /@@@ note/g,
    replace: () => {
      return '<div class="note">';
    },
  };
  // @@@ note { title= }
  const noteTitleExtension = {
    type: 'lang',
    regex: /@@@ note \{ title='(.*)' \}/g,
    replace: (expr, title) => {
      return `<div class="note"><div class="note-title">${title}</div>`;
    },
  };
  return [
    refextension,
    warningTitleExtension,
    noteTitleExtension,
    warningExtension,
    noteExtension,
    tripleArobase,
  ];
}

const converter = new showdown.Converter({
  omitExtraWLInCodeBlocks: true,
  ghCompatibleHeaderId: true,
  parseImgDimensions: true,
  simplifiedAutoLink: true,
  tables: true,
  tasklists: true,
  requireSpaceBeforeHeadingText: true,
  ghMentions: true,
  emoji: true,
  ghMentionsLink: '/{u}',
  extensions: [DaikokuExtension],
});

export const MarkdownInput = (props) => {
  const [preview, setPreview] = useState(false);
  const [editor, setEditor] = useState(undefined);

  useEffect(() => {
    if (preview) {
      showPreview();
    }
  }, [preview]);

  const commands = [
    {
      name: 'Add header',
      icon: 'heading',
      inject: (selected = ' ') => `# ${selected}`,
    },
    {
      name: 'Add bold text',
      icon: 'bold',
      inject: (selected = ' ') => `**${selected}**`,
    },
    {
      name: 'Add italic text',
      icon: 'italic',
      inject: (selected = ' ') => `*${selected}*`,
    },
    {
      name: 'Add strikethrough text',
      icon: 'strikethrough',
      inject: (selected = ' ') => `~~${selected}~~`,
    },
    {
      name: 'Add link',
      icon: 'link',
      inject: (selected = ' ') => `[${selected}](url)`,
    },
    {
      name: 'Add code',
      icon: 'code',
      inject: (selected = ' ') => '```\n' + selected + '\n```\n',
      move: (pos, setPos) => setPos({ column: 0, row: pos.row - 2 }),
    },
    {
      name: 'Add quotes',
      icon: 'quote-right',
      inject: (selected = ' ') => `> ${selected}`,
    },
    {
      name: 'Add image',
      icon: 'image',
      inject: (selected = ' ') => `![${selected}](image-url)`,
    },
    {
      name: 'Add unordered list',
      icon: 'list-ul',
      inject: (selected = ' ') => `* ${selected}`,
    },
    {
      name: 'Add ordered list',
      icon: 'list-ol',
      inject: (selected = ' ') => `1. ${selected}`,
    },
    {
      name: 'Add check list',
      icon: 'tasks',
      inject: (selected = ' ') => `* [ ] ${selected}`,
    },
    {
      name: 'Page ref',
      icon: 'book',
      inject: (selected = ' ') => `@ref:[${selected}](team/api/doc)`,
    },
    {
      name: 'Warning',
      icon: 'exclamation-triangle',
      inject: (selected = ' ') => `@@@ warning\n${selected}\n@@@\n`,
      move: (pos, setPos) => setPos({ column: 0, row: pos.row - 2 }),
    },
    {
      name: 'Warning with title',
      icon: 'exclamation-circle',
      inject: (selected = ' ') => `@@@ warning { title='A nice title' }\n${selected}\n@@@\n`,
      move: (pos, setPos) => setPos({ column: 0, row: pos.row - 2 }),
    },
    {
      name: 'Note',
      icon: 'sticky-note',
      inject: (selected = ' ') => `@@@ note\n${selected}\n@@@\n`,
      move: (pos, setPos) => setPos({ column: 0, row: pos.row - 2 }),
    },
    {
      name: 'Note with title',
      icon: 'clipboard',
      inject: (selected = ' ') => `@@@ note { title='A nice title' }\n${selected}\n@@@\n`,
      move: (pos, setPos) => setPos({ column: 0, row: pos.row - 2 }),
    },
    {
      name: 'Lorem Ipsum',
      icon: 'feather-alt',
      inject: () =>
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus gravida convallis leo et aliquet. Aenean venenatis, elit et dignissim scelerisque, urna dui mollis nunc, id eleifend velit sem et ante. Quisque pharetra sed tellus id finibus. In quis porta libero. Nunc egestas eros elementum lacinia blandit. Donec nisi lacus, tristique vel blandit in, sodales eget lacus. Phasellus ultrices magna vel odio vestibulum, a rhoncus nunc ornare. Sed laoreet finibus arcu vitae aliquam. Aliquam quis ex dui.',
    },
    {
      name: 'Long Lorem Ipsum',
      icon: 'feather',
      inject: () => `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus gravida convallis leo et aliquet. Aenean venenatis, elit et dignissim scelerisque, urna dui mollis nunc, id eleifend velit sem et ante. Quisque pharetra sed tellus id finibus. In quis porta libero. Nunc egestas eros elementum lacinia blandit. Donec nisi lacus, tristique vel blandit in, sodales eget lacus. Phasellus ultrices magna vel odio vestibulum, a rhoncus nunc ornare. Sed laoreet finibus arcu vitae aliquam. Aliquam quis ex dui.

Cras ut ultrices quam. Nulla eu purus sed turpis consequat sodales. Aenean vitae efficitur velit, vel accumsan felis. Curabitur aliquam odio dictum urna convallis faucibus. Vivamus eu dignissim lorem. Donec sed hendrerit massa. Suspendisse volutpat, nisi at fringilla consequat, eros lacus aliquam metus, eu convallis nulla mauris quis lacus. Aliquam ultricies, mi eget feugiat vestibulum, enim nunc eleifend nisi, nec tincidunt turpis elit id diam. Nunc placerat accumsan tincidunt. Nulla ut interdum dui. Praesent venenatis cursus aliquet. Nunc pretium rutrum felis nec pharetra.

Vivamus sapien ligula, hendrerit a libero vitae, convallis maximus massa. Praesent ante leo, fermentum vitae libero finibus, blandit porttitor risus. Nulla ac hendrerit turpis. Sed varius velit at libero feugiat luctus. Nunc rhoncus sem dolor, nec euismod justo rhoncus vitae. Vivamus finibus nulla a purus vestibulum sagittis. Maecenas maximus orci at est lobortis, nec facilisis erat rhoncus. Sed tempus leo et est dictum lobortis. Vestibulum rhoncus, nisl ut porta sollicitudin, arcu urna egestas arcu, eget efficitur neque ipsum ut felis. Ut commodo purus quis turpis tempus tincidunt. Donec id hendrerit eros. Vestibulum vitae justo consectetur, egestas nisi ac, eleifend odio.

Donec id mi cursus, volutpat dolor sed, bibendum sapien. Etiam vitae mauris sit amet urna semper tempus vel non metus. Integer sed ligula diam. Aenean molestie ultrices libero eget suscipit. Phasellus maximus euismod eros ut scelerisque. Ut quis tempus metus. Sed mollis volutpat velit eget pellentesque. Integer hendrerit ultricies massa eu tincidunt. Quisque at cursus augue. Sed diam odio, molestie sed dictum eget, efficitur nec nulla. Nullam vulputate posuere nunc nec laoreet. Integer varius sed erat vitae cursus. Vivamus auctor augue enim, a fringilla mauris molestie eget.

Proin vehicula ligula vel enim euismod, sed congue mi egestas. Nullam varius ut felis eu fringilla. Quisque sodales tortor nec justo tristique, sit amet consequat mi tincidunt. Suspendisse porttitor laoreet velit, non gravida nibh cursus at. Pellentesque faucibus, tellus in dapibus viverra, dolor mi dignissim tortor, id convallis ipsum lorem id nisl. Sed id nisi felis. Aliquam in ullamcorper ipsum, vel consequat magna. Donec nec mollis lacus, a euismod elit.`,
    },
  ];

  const showPreview = () => {
    Array.from(document.querySelectorAll('pre code')).forEach((block, idx) => {
      window.hljs.highlightElement(block);
    });
  };

  const injectButtons = () => {
    return commands.map((command, idx) => {
      if (command.component) {
        return command.component(idx);
      }
      return (
        <button
          type="button"
          className="btn-for-descriptionToolbar"
          style={{
            textAlign: "left",
            cursor: "pointer",
            height: "22px",
            padding: "4px",
            border: "none",
            background: "none",
            color: "#242729",
            marginRight: "5px",
            marginLeft: "5px"
          }}
          aria-label={command.name}
          title={command.name}
          key={`toolbar-btn-${idx}`}
          onClick={() => {
            const selection = editor.getSelection();
            if (selection) {
              editor.session.replace(
                selection.getRange(),
                command.inject(editor.getSelectedText())
              );
            } else {
              editor.session.insert(editor.getCursorPosition(), command.inject());
            }
            if (command.move) {
              command.move(editor.getCursorPosition(), (p) => editor.moveCursorToPosition(p));
            }
            editor.focus();
          }}>
          <i className={`fas fa-${command.icon}`} />
        </button>
      );
    });
  };

  return (
    <div className={classNames("d-flex flex-column", props.className)}>
      <div
        style={{
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
        className="d-flex flex-sm-row flex-column align-items-center">
        <div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ color: !preview ? '#7f96af' : 'white' }}
              onClick={() => setPreview(false)}>
              Write
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ color: preview ? '#7f96af' : 'white' }}
              onClick={() => setPreview(true)}>
              Preview
            </button>
          </div>
        </div>
        <div className="d-flex flex-row">{injectButtons()}</div>
      </div>
      {!preview && (
        <AceEditor
          commands={Beautify.commands}
          ref={(r) => {
            if (r && r.editor) {
              setEditor(r.editor);
            }
          }}
          mode="markdown"
          theme={props.theme | 'monokai'}
          style={{ zIndex: 0, isolation: 'isolate' }}
          onChange={props.onChange}
          onLoad={editorInstance => {

            editorInstance.container.style.resize = "both";
            // mouseup = css resize end
            document.addEventListener("mouseup", e => (
              editorInstance.resize()
            ));
          }}
          value={props.value}
          name="scriptParam"
          editorProps={{ $blockScrolling: true }}
          height={props.height || '300px'}
          width={props.width || '100%'}
          showGutter={true}
          tabSize={2}
          highlightActiveLine={true}
          enableBasicAutocompletion={true}
          enableLiveAutocompletion={true}
        />
      )}
      {preview && (
        <div
          className="api-description"
          dangerouslySetInnerHTML={{ __html: converter.makeHtml(props.value) }}
        />
      )}
    </div>
  );
};

