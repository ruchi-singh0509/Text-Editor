import { useState } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  convertFromRaw,
  CompositeDecorator,
  Modifier,
  convertToRaw,
} from 'draft-js';
import 'draft-js/dist/Draft.css';


const applyBlockStyle = (contentBlock) => {
  const blockType = contentBlock.getType();
  switch (blockType) {
    case 'header-one':
      return 'header-one';
    default:
      return '';
  }
};


const RED_COLOR_STYLE = { color: 'red' };

const highlightRedText = {
  strategy: (contentBlock, callback) => contentBlock.findStyleRanges(
    (character) => character.hasStyle('RED_COLOR'),
    callback,
  ),
  component: (props) => <span style={RED_COLOR_STYLE}>{props.children}</span>,
};

const editorDecorator = new CompositeDecorator([highlightRedText]);

const TextEditor = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [editorState, setEditorState] = useState(() => {
    const savedContent = localStorage.getItem('SavedContent');
    return savedContent
      ? EditorState.createWithContent(
        convertFromRaw(JSON.parse(savedContent)),
        editorDecorator,
      )
      : EditorState.createEmpty(editorDecorator);
  });

  const handleEditorChange = (newEditorState) => {
    let contentState = newEditorState.getCurrentContent();
    const selectionState = newEditorState.getSelection();
    const anchorKey = selectionState.getAnchorKey();
    const currentContentBlock = contentState.getBlockForKey(anchorKey);
    const start = selectionState.getStartOffset();
    const text = currentContentBlock.getText();

    // Function to apply block type and remove the marker
    const applyBlockTypeAndRemoveMarker = (blockType, marker) => {
      const markerLength = marker.length;
      const newSelection = selectionState.merge({
        anchorOffset: 0,
        focusOffset: markerLength,
      });

      // Remove the marker and apply the block type
      const newContentState = Modifier.removeRange(
        contentState,
        newSelection,
        'backward',
      );
      const updatedEditorState = EditorState.push(
        newEditorState,
        newContentState,
        'change-block-type',
      );
      return RichUtils.toggleBlockType(updatedEditorState, blockType);
    };

    // Check for markers followed by a space
    if (text.startsWith('#')) {
      const marker = '#';
      // check if the marker is followed by a space or the end of the line
      if (text.charAt(marker.length) === ' ' || start === marker.length) {
        setEditorState(applyBlockTypeAndRemoveMarker('header-one', marker));
      }
    } else if (text.startsWith('*')) {
      const marker = '*';
      // check if the marker is followed by a space or the end of the line
      if (text.charAt(marker.length) === ' ' || start === marker.length) {
        setEditorState(applyBlockTypeAndRemoveMarker('unstyled', marker));
        setEditorState(RichUtils.toggleInlineStyle(newEditorState, 'BOLD'));
      }
    } else if (text.startsWith('**')) {
      const marker = '**';
      // check if the marker is followed by a space or the end of the line
      if (text.charAt(marker.length) === ' ' || start === marker.length) {
        setEditorState(applyBlockTypeAndRemoveMarker('unstyled', marker));
        setEditorState(RichUtils.toggleInlineStyle(newEditorState, 'RED_COLOR'));
      }
    } else if (text.startsWith('***')) {
      const marker = '***';
      // check if the marker is followed by a space or the end of the line
      if (text.charAt(marker.length) === ' ' || start === marker.length) {
        setEditorState(applyBlockTypeAndRemoveMarker('unstyled', marker));
        setEditorState(RichUtils.toggleInlineStyle(newEditorState, 'UNDERLINE'));
      }
    } else {
      setEditorState(newEditorState);
    }


    // Save to local storage
    if (isSaving) {
      localStorage.setItem(
        'SavedContent',
        JSON.stringify(convertToRaw(newEditorState.getCurrentContent()))
      );
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-container">
          <h3>Demo editor by Ruchi Singh</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsSaving(!isSaving)}
          className="save-button"
          disabled={isSaving}
        >
          {isSaving ? 'SAVED' : 'SAVE'}
        </button>
      </div>
      <div className="editor-border">
        <Editor
          editorState={editorState}
          handleKeyCommand={(command, state) => (RichUtils.handleKeyCommand(state, command)
            ? 'handled'
            : 'not-handled')}
          keyBindingFn={getDefaultKeyBinding}
          handlePastedText={(state) => handleEditorChange(state)}
          onChange={handleEditorChange}
          blockStyleFn={applyBlockStyle}
          placeholder="Start typing here..."
          className="editor"
        />
      </div>
    </div>
  );
};

export default TextEditor;