import React, { useState, useEffect, useRef, useContext } from 'react';
import showdown from 'showdown';
import classNames from 'classnames';


import '@fortawesome/fontawesome-free/css/all.css';
import 'highlight.js/styles/monokai.css';
import hljs from 'highlight.js/lib/core';

// ['javascript', 'json', 'markdown', 'css'].forEach((langName) => {
//   // Using require() here because import() support hasn't landed in Webpack yet
//   const langModule = require(`highlight.js/lib/languages/${langName}`);
//   hljs.registerLanguage(langName, langModule);
// });

import { CodeInput } from './CodeInput';

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
  ghMentionsLink: '/{u}'
});

interface Range {
  from: any;
  to: any;
}

export const MarkdownInput = (props: { value?: string, preview?: boolean, className: string, readOnly?: boolean, onChange?: (value: string) => void, actions?: (inject: (text: string) => void) => JSX.Element }) => {
  const [preview, setPreview] = useState<boolean>(props.preview || false);
  const ref = useRef<any>()

  useEffect(() => {
    if (preview) {
      showPreview();
    }
  }, [preview, props.value]);

  const commands = [
    {
      name: 'Add header',
      icon: 'heading',
      inject: (range: Range) => [{ from: range.from, insert: "# " }]
    },
    {
      name: 'Add bold text',
      icon: 'bold',
      inject: (range: Range) => [{ from: range.from, insert: "**" }, { from: range.to, insert: '**' }]
    },
    {
      name: 'Add italic text',
      icon: 'italic',
      inject: (range: Range) => [{ from: range.from, insert: '*' }, { from: range.to, insert: '*' }]
    },
    {
      name: 'Add strikethrough text',
      icon: 'strikethrough',
      inject: (range: Range) => [{ from: range.from, insert: '~~' }, { from: range.to, insert: '~~' }]
    },
    {
      name: 'Add link',
      icon: 'link',
      inject: (range: Range) => [{ from: range.from, insert: '[' }, { from: range.to, insert: '](url)' }]
    },
    {
      name: 'Add code',
      icon: 'code',
      inject: (range: Range) => [{ from: range.from, insert: '```\n' }, { from: range.to, insert: '\n```\n' }]
    },
    {
      name: 'Add quotes',
      icon: 'quote-right',
      inject: (range: Range) => [{ from: range.from, insert: '> ' }]
    },
    {
      name: 'Add image',
      icon: 'image',
      inject: (range: Range) => [{ from: range.from, insert: '![' }, { from: range.to, insert: '](image-url)' }]
    },
    {
      name: 'Add unordered list',
      icon: 'list-ul',
      inject: (range: Range) => [{ from: range.from, insert: '* ' }]
    },
    {
      name: 'Add ordered list',
      icon: 'list-ol',
      inject: (range: Range) => [{ from: range.from, insert: '1. ' }]
    },
    {
      name: 'Add check list',
      icon: 'tasks',
      inject: (range: Range) => [{ from: range.from, insert: '* [ ] ' }]
    }
  ];

  const showPreview = () => {
    const parent = [...document.getElementsByClassName('mrf-preview')]
    if (parent.length > 0)
      [...parent[0].querySelectorAll('pre code')]
        .forEach(block => hljs.highlightElement(block as HTMLElement));
  };

  const injectButtons = () => {
    return (
      <>
        {commands.map((command, idx) => {
          return (
            <button
              type="button"
              className={classNames('mrf-btn_for_descriptionToolbar')}
              aria-label={command.name}
              title={command.name}
              key={`toolbar-btn-${idx}`}
              onClick={() => {
                const editor = ref.current
                editor.dispatch(editor.state.changeByRange((range: Range) => ({
                  changes: command.inject(range),
                  range
                })))
                editor.focus()
              }}>
              <i className={`fas fa-${command.icon}`} />
            </button>
          );
        })}
        {props.actions && props.actions((text) => {
          const editor = ref.current
          editor.dispatch(editor.state.changeByRange((range: Range) => ({
            changes: [{ from: range.from, insert: text }],
            range
          })))
          editor.focus()
        })}
      </>
    )
  };

  return <div className={classNames(props.className)}>
    {!props.readOnly && <div
      style={{
        marginBottom: 10,
      }}
    >
      <div>
        <div>
          <button
            type="button"
            className='mrf-btn mrf-btn_sm'
            style={{ color: !preview ? '#7f96af' : 'white', backgroundColor: preview ? '#7f96af' : 'white' }}
            onClick={() => setPreview(false)}>
            Write
          </button>
          <button
            type="button"
            className='mrf-btn mrf-btn_sm mrf-ml_5'
            style={{ color: preview ? '#7f96af' : 'white', backgroundColor: preview ? 'white' : '#7f96af' }}
            onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
      </div>
      <div className='mrf-flex mrf-flexWrap'>{injectButtons()}</div>
    </div>}
    {!preview && (
      <CodeInput {...props} mode={'markdown'} setRef={e => ref.current = e} />
    )}
    {preview && (
      <div
        className="mrf-preview"
        dangerouslySetInnerHTML={{ __html: converter.makeHtml(props.value || "") }}
      />
    )}
  </div>
};

