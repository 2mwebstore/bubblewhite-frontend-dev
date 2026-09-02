<!-- src/components/admin/RichTextEditor.vue -->
<template>
  <div>
    <span v-if="label" class="mb-1 block text-xs font-medium text-ink">{{ label }}</span>
    <div class="overflow-hidden rounded-lg border border-line bg-white focus-within:border-rust focus-within:ring-1 focus-within:ring-rust/20">
      <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b border-line bg-cream-dark px-2 py-1.5">
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bold') }" title="ដិត" @click="editor.chain().focus().toggleBold().run()"><Bold class="h-4 w-4" /></button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('italic') }" title="ទ្រេត" @click="editor.chain().focus().toggleItalic().run()"><Italic class="h-4 w-4" /></button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('strike') }" title="ឆូតចោល" @click="editor.chain().focus().toggleStrike().run()"><Strikethrough class="h-4 w-4" /></button>
        <span class="mx-1 h-4 w-px bg-line" />
        <button type="button" class="toolbar-btn font-mono text-xs font-bold" :class="{ active: editor.isActive('heading', { level: 2 }) }" title="ចំណងជើង" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
        <button type="button" class="toolbar-btn font-mono text-xs font-bold" :class="{ active: editor.isActive('heading', { level: 3 }) }" title="ចំណងជើងរង" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
        <span class="mx-1 h-4 w-px bg-line" />
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bulletList') }" title="បញ្ជីចំណុច" @click="editor.chain().focus().toggleBulletList().run()"><List class="h-4 w-4" /></button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('codeBlock') }" title="កូដ" @click="editor.chain().focus().toggleCodeBlock().run()"><Code class="h-4 w-4" /></button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('link') }" title="តំណភ្ជាប់" @click="setLink"><Link class="h-4 w-4" /></button>
        <span class="mx-1 h-4 w-px bg-line" />

        <!-- Images: upload to R2, or insert from an existing URL -->
        <button type="button" class="toolbar-btn" title="ផ្ទុករូបភាព" :disabled="uploadingImage" @click="triggerImagePick">
          <Loader2 v-if="uploadingImage" class="h-4 w-4 animate-spin" />
          <Image v-else class="h-4 w-4" />
        </button>
        <input ref="imageInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onImageSelected" />

        <button type="button" class="toolbar-btn" title="ពណ៌អក្សរ" @click="triggerColorPick"><Palette class="h-4 w-4" /></button>
        <input ref="colorInput" type="color" class="hidden" @input="onColorSelected" />
        <button type="button" class="toolbar-btn" title="សម្អាតពណ៌" @click="clearColor"><X class="h-3.5 w-3.5" /></button>
        <span class="mx-1 h-4 w-px bg-line" />

        <!-- Table: hover-grid size picker -->
        <div ref="gridRoot" class="relative">
          <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('table') }" title="បញ្ចូលតារាង" @click="gridOpen = !gridOpen">
            <TableIcon class="h-4 w-4" />
          </button>
          <div v-if="gridOpen" class="absolute left-0 top-full z-20 mt-1.5 rounded-lg border border-line bg-white p-2.5 shadow-lg">
            <p class="mb-1.5 text-center font-mono text-[11px] text-muted">
              {{ gridHover.rows && gridHover.cols ? `${gridHover.rows} × ${gridHover.cols}` : 'ជ្រើសរើសទំហំ' }}
            </p>
            <div class="grid gap-0.5" :style="{ gridTemplateColumns: `repeat(${GRID_MAX}, 1fr)` }">
              <button
                v-for="cell in GRID_MAX * GRID_MAX" :key="cell"
                type="button"
                class="h-4 w-4 rounded-sm border transition-colors"
                :class="(Math.ceil(cell / GRID_MAX) <= gridHover.rows && ((cell - 1) % GRID_MAX) + 1 <= gridHover.cols)
                  ? 'border-rust bg-rust/10'
                  : 'border-line bg-cream-dark'"
                @mouseenter="gridHover = { rows: Math.ceil(cell / GRID_MAX), cols: ((cell - 1) % GRID_MAX) + 1 }"
                @click="insertTable(Math.ceil(cell / GRID_MAX), ((cell - 1) % GRID_MAX) + 1)"
              />
            </div>
          </div>
        </div>
        <button v-if="editor.isActive('table')" type="button" class="toolbar-btn" title="លុបតារាង" @click="deleteTable"><Trash2 class="h-4 w-4" /></button>

        <span class="mx-1 h-4 w-px bg-line" />
        <button type="button" class="toolbar-btn" title="មិនធ្វើវិញ" @click="editor.chain().focus().undo().run()"><Undo2 class="h-4 w-4" /></button>
        <button type="button" class="toolbar-btn" title="ធ្វើវិញ" @click="editor.chain().focus().redo().run()"><Redo2 class="h-4 w-4" /></button>
      </div>
      <EditorContent :editor="editor" class="max-h-96 overflow-y-auto" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapImage from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { TableKit } from '@tiptap/extension-table'
import {
  Bold, Italic, Strikethrough, List, Link, Undo2, Redo2, Code, Image,
  Palette, X, Table as TableIcon, Trash2, Loader2,
} from 'lucide-vue-next'
import { useAdmin } from '../../composables/useAdmin'
import { useStore } from '../../composables/useStore'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'ចាប់ផ្តើមសរសេរ…' },
})
const emit = defineEmits(['update:modelValue'])

const { uploadProductImage } = useAdmin()
const { showToast } = useStore()

const imageInput = ref(null)
const colorInput = ref(null)
const uploadingImage = ref(false)

const editor = useEditor({
  content: props.modelValue ?? '',
  extensions: [
    StarterKit,
    TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-rust underline' } }),
    Placeholder.configure({ placeholder: props.placeholder }),
    TiptapImage.configure({ HTMLAttributes: { class: 'rounded-md max-w-full' } }),
    TextStyle,
    Color,
    TableKit.configure({ table: { resizable: true } }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none min-h-[180px] px-3 py-2.5 text-ink focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Keep the editor in sync if the parent resets modelValue externally
// (e.g. loading a different product into the same form instance).
watch(
  () => props.modelValue,
  (value) => {
    const current = editor.value?.getHTML()
    if (editor.value && value !== current && value !== undefined) {
      editor.value.commands.setContent(value ?? '', { emitUpdate: false })
    }
  }
)

function setLink() {
  if (!editor.value) return
  const previous = editor.value.getAttributes('link').href
  const url = window.prompt('URL តំណភ្ជាប់', previous ?? 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Images: upload straight to R2 via the same endpoint the product form's
// gallery uses, or insert directly from an existing URL.
function triggerImagePick() {
  imageInput.value?.click()
}
async function onImageSelected(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  uploadingImage.value = true
  try {
    const result = await uploadProductImage(file)
    editor.value?.chain().focus().setImage({ src: result.url, alt: file.name }).run()
  } catch (err) {
    showToast(err.message || 'មិនអាចផ្ទុករូបភាពបានទេ')
  } finally {
    uploadingImage.value = false
  }
}

function triggerColorPick() {
  colorInput.value?.click()
}
function onColorSelected(e) {
  const value = e.target.value
  editor.value?.chain().focus().setColor(value).run()
}
function clearColor() {
  editor.value?.chain().focus().unsetColor().run()
}

// ---- Table grid-size picker (Word/Sheets-style hover grid) ----
const GRID_MAX = 8
const gridOpen = ref(false)
const gridHover = ref({ rows: 0, cols: 0 })
const gridRoot = ref(null)
onClickOutside(gridRoot, () => {
  gridOpen.value = false
})

function insertTable(rows, cols) {
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  gridOpen.value = false
  gridHover.value = { rows: 0, cols: 0 }
}
function deleteTable() {
  editor.value?.chain().focus().deleteTable().run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border-radius: 0.375rem;
  color: theme('colors.ink');
  opacity: 0.6;
  transition: all 0.12s ease;
}
.toolbar-btn:hover {
  opacity: 1;
  background: theme('colors.line');
}
.toolbar-btn.active {
  opacity: 1;
  background: color-mix(in srgb, theme('colors.rust') 12%, transparent);
  color: theme('colors.rust');
}
.toolbar-btn:disabled {
  opacity: 0.3;
  pointer-events: none;
}

/* Table styling — TipTap emits plain <table>/<td> with no visual borders
   by default, so the grid the admin just built would otherwise be
   invisible both in the editor and on the published product page. */
:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75rem 0;
}
:deep(td),
:deep(th) {
  border: 1px solid theme('colors.line');
  padding: 0.4rem 0.6rem;
  text-align: left;
  vertical-align: top;
}
:deep(th) {
  background: theme('colors.cream-dark');
  font-weight: 600;
}
:deep(.selectedCell) {
  background: color-mix(in srgb, theme('colors.rust') 12%, transparent);
}
</style>
