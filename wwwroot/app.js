(() => {
    const state = {
        path: '',
        query: '',
        mode: 'browse',
        loading: false,
        error: '',
        success: '',
        data: null,
        root: '',
        pendingDeletePath: ''
    };

    const helpers = {
        formatBytes,
        escapeHtml,
        getLastPathSegment,
        getParentPath,
        combinePath,
        parseUrlState(searchString) {
            const params = new URLSearchParams(searchString || '');
            const path = params.get('path') || '';
            const query = params.get('q') || '';
            return {
                open: params.get('open') === '1',
                path,
                query,
                mode: query ? 'search' : 'browse'
            };
        },
        buildUrlState(path, query) {
            const params = new URLSearchParams();
            params.set('open', '1');
            if (path) {
                params.set('path', path);
            }
            if (query) {
                params.set('q', query);
            }
            return `?${params.toString()}`;
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = helpers;
    }

    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return;
    }

    const ui = {
        app: document.getElementById('app'),
        openBtn: document.getElementById('openBrowserBtn'),
        dialog: document.getElementById('browserDialog'),
        closeBtn: document.getElementById('closeDialogBtn')
    };

    let successTimeoutId = null;

    if (!ui.app || !ui.openBtn || !ui.dialog || !ui.closeBtn) {
        return;
    }

    ui.openBtn.addEventListener('click', () => {
        ui.dialog.showModal();
        refreshFromLocation();
    });

    ui.closeBtn.addEventListener('click', () => ui.dialog.close());

    window.addEventListener('popstate', refreshFromLocation);

    init();

    async function init() {
        await fetchRoot();
        if (new URLSearchParams(window.location.search).get('open') === '1') {
            ui.dialog.showModal();
        }
        await refreshFromLocation();
    }

    async function fetchRoot() {
        try {
            const response = await fetch('/api/files/root');
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            state.root = payload.root ?? '';
        } catch {
            state.root = '';
        }
    }

    async function refreshFromLocation() {
        const params = new URLSearchParams(window.location.search);
        state.path = params.get('path') || '';
        state.query = params.get('q') || '';
        state.mode = state.query ? 'search' : 'browse';
        await loadData();
    }

    async function loadData() {
        state.loading = true;
        state.error = '';
        render();

        const isSearch = !!state.query;
        const endpoint = isSearch
            ? `/api/files/search?path=${encodeURIComponent(state.path)}&query=${encodeURIComponent(state.query)}`
            : `/api/files/browse?path=${encodeURIComponent(state.path)}`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                const error = await safeJson(response);
                throw new Error(error?.message || `Request failed: ${response.status}`);
            }

            state.data = await response.json();
        } catch (error) {
            state.data = null;
            state.success = '';
            state.error = error?.message || 'Unexpected error';
        } finally {
            state.loading = false;
            render();
        }
    }

    function navigate(nextPath, nextQuery, replace) {
        const params = new URLSearchParams();
        params.set('open', '1');
        if (nextPath) {
            params.set('path', nextPath);
        }
        if (nextQuery) {
            params.set('q', nextQuery);
        }

        const nextUrl = `${window.location.pathname}?${params.toString()}`;
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method]({}, '', nextUrl);
        refreshFromLocation();
    }

    function formatBytes(bytes) {
        const num = Number(bytes || 0);
        if (num < 1024) return `${num} B`;
        if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
        if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
        return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function render() {
        const stats = state.data?.stats;
        const rows = state.data?.entries || [];
        const showParentRow = !!state.data && state.mode === 'browse' && state.data.parentPath !== null;
        const showLocationColumn = state.mode === 'search';

        ui.app.innerHTML = `
            <div class="toolbar">
                <input type="text" id="searchInput" placeholder="search current folder recursively" value="${escapeHtml(state.query)}" />
                <button type="button" id="searchBtn">Search</button>
                <button type="button" id="clearSearchBtn" ${state.query ? '' : 'disabled'}>Clear Search</button>
            </div>

            <div class="toolbar">
                <input type="file" id="uploadInput" />
                <button type="button" id="uploadToFolderBtn">Upload to Folder...</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        ${showLocationColumn ? '<th>Folder</th>' : ''}
                        <th>Type</th>
                        <th>Size</th>
                        <th>Modified (UTC)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length === 0 && !showParentRow ? `<tr><td colspan="5">${state.loading ? 'Loading…' : 'No entries'}</td></tr>` : ''}
                    ${showParentRow ? `
                        <tr>
                            <td><button type="button" class="row-link" data-open-parent="1">..</button></td>
                            ${showLocationColumn ? '<td>-</td>' : ''}
                            <td>Parent Folder</td>
                            <td>-</td>
                            <td>-</td>
                            <td class="actions"></td>
                        </tr>
                    ` : ''}
                    ${rows.map(row => `
                        <tr>
                            <td>
                                ${row.isDirectory
                                    ? `<button type="button" class="row-link" data-open="${escapeHtml(row.relativePath)}">${escapeHtml(row.name)}</button>`
                                    : `${escapeHtml(row.name)}`}
                            </td>
                            ${showLocationColumn ? `<td>${escapeHtml(getParentPath(row.relativePath) || '(root)')}</td>` : ''}
                            <td>${row.isDirectory ? 'Folder' : 'File'}</td>
                            <td>${row.isDirectory ? '-' : formatBytes(row.size)}</td>
                            <td>${escapeHtml(row.lastModifiedUtc || '')}</td>
                            <td class="actions">
                                ${row.isDirectory ? '' : `<button type="button" data-download="${escapeHtml(row.relativePath)}">Download</button>`}
                                <button type="button" data-copy="${escapeHtml(row.relativePath)}">Copy</button>
                                <button type="button" data-move="${escapeHtml(row.relativePath)}">Move</button>
                                <button type="button" class="danger" data-delete="${escapeHtml(row.relativePath)}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="muted" style="margin-top:8px;">
                Files: ${stats?.fileCount ?? 0} |
                Folders: ${stats?.directoryCount ?? 0} |
                Total file bytes: ${formatBytes(stats?.totalFileBytes ?? 0)}
                ${state.data?.truncated ? ' | Showing the first ' + ((stats?.fileCount ?? 0) + (stats?.directoryCount ?? 0)) + ' matches only. Narrow your search to see more.' : ''}
            </div>

            <dialog id="moveCopyDialog">
                <div><strong id="moveCopyTitle">Copy</strong></div>
                <div class="muted" style="margin:6px 0 10px;">Paths are relative to server root.</div>
                <div style="display:grid; gap:8px;">
                    <label id="sourcePathRow">
                        Source path
                        <input type="text" id="moveCopySourceInput" />
                    </label>
                    <div id="sourcePathDisplayRow" style="display:none;">
                        <span class="muted">Moving:</span> <code id="moveSourcePathText"></code>
                    </div>
                    <label id="destinationPathRow">
                        Destination path
                        <input type="text" id="moveCopyDestinationInput" />
                    </label>
                    <div id="moveDestinationPicker" style="display:none; border:1px solid #ddd; padding:8px; border-radius:6px;">
                        <div class="muted" id="destinationPickerLabel">Select destination folder:</div>
                        <div class="muted">Destination folder: <code id="moveDestCurrentPath">(root)</code></div>
                        <div id="moveDestList" style="margin-top:8px;"></div>
                    </div>
                    <label>
                        <input type="checkbox" id="moveCopyOverwriteInput" /> Overwrite destination if it exists
                    </label>
                </div>
                <div class="toolbar" style="margin-top:10px;">
                    <button type="button" id="submitMoveCopyBtn">Apply</button>
                    <button type="button" id="closeMoveCopyBtn">Cancel</button>
                </div>
            </dialog>

            <dialog id="uploadDestinationDialog">
                <div><strong>Choose Upload Folder</strong></div>
                <div class="muted" style="margin:6px 0 10px;">Select the destination folder for uploaded files.</div>
                <div class="muted">Selected folder: <code id="uploadDestCurrentPath">(root)</code></div>
                <div id="uploadDestList" style="margin-top:8px;"></div>
                <div class="toolbar" style="margin-top:10px;">
                    <button type="button" id="uploadHereBtn">Upload Here</button>
                    <button type="button" id="closeUploadDestinationBtn">Cancel</button>
                </div>
            </dialog>

            <dialog id="deleteDialog">
                <div><strong>Confirm Delete</strong></div>
                <p>Delete this path?</p>
                <p><code id="deletePathText"></code></p>
                <div class="toolbar">
                    <button type="button" class="danger" id="confirmDeleteBtn">Delete</button>
                    <button type="button" id="closeDeleteBtn">Cancel</button>
                </div>
            </dialog>

            <div class="status ${state.error ? 'danger' : (state.success ? 'success' : '')}">${escapeHtml(state.error || state.success)}</div>
        `;

        bindEvents();
    }

    function bindEvents() {
        ui.app.querySelector('#searchBtn')?.addEventListener('click', () => {
            const nextQuery = ui.app.querySelector('#searchInput')?.value?.trim() || '';
            navigate(state.path, nextQuery, false);
        });

        ui.app.querySelector('#clearSearchBtn')?.addEventListener('click', () => {
            navigate(state.path, '', false);
        });

        ui.app.querySelector('#uploadToFolderBtn')?.addEventListener('click', () => {
            const fileInput = ui.app.querySelector('#uploadInput');
            const file = fileInput?.files?.[0];
            if (!file) {
                state.error = 'Pick a file first.';
                render();
                return;
            }

            openUploadDestinationDialog(state.path || '');
        });

        ui.app.querySelectorAll('[data-open]').forEach(button => {
            button.addEventListener('click', event => {
                const target = event.currentTarget;
                const relativePath = target.getAttribute('data-open') || '';
                navigate(relativePath, '', false);
            });
        });

        ui.app.querySelector('[data-open-parent]')?.addEventListener('click', () => {
            if (!state.data || state.data.parentPath === null) {
                return;
            }
            navigate(state.data.parentPath, '', false);
        });

        ui.app.querySelectorAll('[data-download]').forEach(button => {
            button.addEventListener('click', event => {
                const target = event.currentTarget;
                const relativePath = target.getAttribute('data-download') || '';
                window.location.href = `/api/files/download?path=${encodeURIComponent(relativePath)}`;
            });
        });

        ui.app.querySelectorAll('[data-delete]').forEach(button => {
            button.addEventListener('click', event => {
                const target = event.currentTarget;
                const relativePath = target.getAttribute('data-delete') || '';
                openDeleteDialog(relativePath);
            });
        });

        ui.app.querySelectorAll('[data-copy]').forEach(button => {
            button.addEventListener('click', event => {
                const target = event.currentTarget;
                const relativePath = target.getAttribute('data-copy') || '';
                openMoveCopyDialog('copy', relativePath);
            });
        });

        ui.app.querySelectorAll('[data-move]').forEach(button => {
            button.addEventListener('click', event => {
                const target = event.currentTarget;
                const relativePath = target.getAttribute('data-move') || '';
                openMoveCopyDialog('move', relativePath);
            });
        });

        ui.app.querySelector('#closeMoveCopyBtn')?.addEventListener('click', () => ui.app.querySelector('#moveCopyDialog')?.close());
        ui.app.querySelector('#submitMoveCopyBtn')?.addEventListener('click', submitMoveCopy);
        ui.app.querySelector('#closeDeleteBtn')?.addEventListener('click', () => ui.app.querySelector('#deleteDialog')?.close());
        ui.app.querySelector('#confirmDeleteBtn')?.addEventListener('click', deletePendingPath);

        ui.app.querySelector('#closeUploadDestinationBtn')?.addEventListener('click', () => ui.app.querySelector('#uploadDestinationDialog')?.close());
        ui.app.querySelector('#uploadHereBtn')?.addEventListener('click', async () => {
            const dialog = ui.app.querySelector('#uploadDestinationDialog');
            if (!dialog) {
                return;
            }

            const destinationPath = dialog.dataset.selectedFolder || '';
            await uploadSelectedFileToPath(destinationPath);
        });
    }

    async function uploadSelectedFileToPath(uploadPath) {
        const fileInput = ui.app.querySelector('#uploadInput');
        const file = fileInput?.files?.[0];
        if (!file) {
            state.error = 'Pick a file first.';
            render();
            return;
        }

        const form = new FormData();
        form.append('file', file);

        try {
            const response = await fetch(`/api/files/upload?path=${encodeURIComponent(uploadPath || '')}`, {
                method: 'POST',
                body: form
            });

            if (!response.ok) {
                const payload = await safeJson(response);
                throw new Error(payload?.message || `Upload failed to "${uploadPath || '(root)'}".`);
            }

            ui.app.querySelector('#uploadDestinationDialog')?.close();
            await loadData();
            state.error = '';
            setTemporarySuccess(`Successfully uploaded "${file.name}" to "${uploadPath || '(root)'}".`);
        } catch (error) {
            clearTemporarySuccess();
            state.success = '';
            state.error = error?.message || `Upload failed to "${uploadPath || '(root)'}".`;
            render();
        }
    }

    function setTemporarySuccess(message) {
        clearTemporarySuccess();
        state.success = message;
        render();

        successTimeoutId = window.setTimeout(() => {
            state.success = '';
            render();
            successTimeoutId = null;
        }, 5000);
    }

    function clearTemporarySuccess() {
        if (successTimeoutId !== null) {
            window.clearTimeout(successTimeoutId);
            successTimeoutId = null;
        }
    }

    function openUploadDestinationDialog(path) {
        const dialog = ui.app.querySelector('#uploadDestinationDialog');
        if (!dialog) {
            return;
        }

        loadUploadDestinationFolders(path || '');
        dialog.showModal();
    }

    async function loadUploadDestinationFolders(path) {
        const dialog = ui.app.querySelector('#uploadDestinationDialog');
        const list = ui.app.querySelector('#uploadDestList');
        const currentPathText = ui.app.querySelector('#uploadDestCurrentPath');

        if (!dialog || !list || !currentPathText) {
            return;
        }

        list.textContent = 'Loading folders...';

        try {
            const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path || '')}`);
            if (!response.ok) {
                const payload = await safeJson(response);
                throw new Error(payload?.message || `Could not load upload folders (HTTP ${response.status}).`);
            }

            const payload = await response.json();
            const folders = (payload.entries || []).filter(entry => entry.isDirectory);
            dialog.dataset.selectedFolder = payload.currentPath || '';
            currentPathText.textContent = payload.currentPath || '(root)';

            list.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payload.parentPath !== null ? `
                            <tr>
                                <td><button type="button" class="row-link" data-upload-dest-parent="1">..</button></td>
                                <td>Parent Folder</td>
                            </tr>
                        ` : ''}
                        ${folders.length === 0 ? `<tr><td colspan="2" class="muted">No child folders here.</td></tr>` : folders.map(folder => `
                            <tr>
                                <td><button type="button" class="row-link" data-upload-dest-open="${escapeHtml(folder.relativePath)}">${escapeHtml(folder.name)}</button></td>
                                <td>Folder</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            list.querySelectorAll('[data-upload-dest-open]').forEach(button => {
                button.addEventListener('click', event => {
                    const target = event.currentTarget;
                    const nextPath = target.getAttribute('data-upload-dest-open') || '';
                    loadUploadDestinationFolders(nextPath);
                });
            });

            list.querySelector('[data-upload-dest-parent]')?.addEventListener('click', () => {
                loadUploadDestinationFolders(payload.parentPath || '');
            });
        } catch (error) {
            list.innerHTML = `<div class="danger">${escapeHtml(error?.message || 'Could not load upload folders.')}</div>`;
        }
    }

    function openMoveCopyDialog(mode, sourcePath) {
        const dialog = ui.app.querySelector('#moveCopyDialog');
        const title = ui.app.querySelector('#moveCopyTitle');
        const submitMoveCopyBtn = ui.app.querySelector('#submitMoveCopyBtn');
        const destinationPickerLabel = ui.app.querySelector('#destinationPickerLabel');
        const sourceInput = ui.app.querySelector('#moveCopySourceInput');
        const sourcePathRow = ui.app.querySelector('#sourcePathRow');
        const sourcePathDisplayRow = ui.app.querySelector('#sourcePathDisplayRow');
        const moveSourcePathText = ui.app.querySelector('#moveSourcePathText');
        const destinationInput = ui.app.querySelector('#moveCopyDestinationInput');
        const destinationPathRow = ui.app.querySelector('#destinationPathRow');
        const moveDestinationPicker = ui.app.querySelector('#moveDestinationPicker');
        const overwriteInput = ui.app.querySelector('#moveCopyOverwriteInput');

        if (!dialog || !title || !submitMoveCopyBtn || !destinationPickerLabel || !sourceInput || !sourcePathRow || !sourcePathDisplayRow || !moveSourcePathText || !destinationInput || !destinationPathRow || !moveDestinationPicker || !overwriteInput) {
            return;
        }

        dialog.dataset.mode = mode;
        dialog.dataset.sourcePath = sourcePath || '';
        title.textContent = mode === 'move' ? 'Move Path' : 'Copy Path';
        submitMoveCopyBtn.textContent = mode === 'move' ? 'Move' : 'Copy';
        destinationPickerLabel.textContent = mode === 'move' ? 'Select destination folder for move:' : 'Select destination folder for copy:';
        sourceInput.value = sourcePath || '';
        sourceInput.readOnly = true;
        destinationInput.value = '';
        overwriteInput.checked = false;

        sourcePathRow.style.display = 'none';
        sourcePathDisplayRow.style.display = 'block';
        moveSourcePathText.textContent = sourcePath || '';
        destinationPathRow.style.display = 'none';
        moveDestinationPicker.style.display = 'block';
        dialog.dataset.moveDestinationFolder = '';
        dialog.dataset.moveDestinationParent = '';
        loadMoveDestinationFolders(state.path || '');

        dialog.showModal();
    }

    async function submitMoveCopy() {
        const dialog = ui.app.querySelector('#moveCopyDialog');
        const sourceInput = ui.app.querySelector('#moveCopySourceInput');
        const destinationInput = ui.app.querySelector('#moveCopyDestinationInput');
        const overwriteInput = ui.app.querySelector('#moveCopyOverwriteInput');

        if (!dialog || !sourceInput || !destinationInput || !overwriteInput) {
            return;
        }

        const mode = dialog.dataset.mode === 'move' ? 'move' : 'copy';
        const sourcePath = (dialog.dataset.sourcePath || sourceInput.value || '').trim();
        const destinationPath = combinePath(dialog.dataset.moveDestinationFolder || '', getLastPathSegment(sourcePath));
        const overwrite = overwriteInput.checked;

        if (!sourcePath || !destinationPath) {
            state.error = 'Source and destination paths are required.';
            render();
            return;
        }

        if (sourcePath === destinationPath) {
            state.error = 'Source and destination cannot be the same path.';
            render();
            return;
        }

        try {
            const response = await fetch(`/api/files/${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourcePath, destinationPath, overwrite })
            });

            if (!response.ok) {
                const payload = await safeJson(response);
                throw new Error(
                    payload?.message
                    || `${mode === 'move' ? 'Move' : 'Copy'} failed from "${sourcePath}" to "${destinationPath}" (HTTP ${response.status}).`
                );
            }

            dialog.close();
            await loadData();
            state.error = '';
            setTemporarySuccess(`${mode === 'move' ? 'Moved' : 'Copied'} "${sourcePath}" to "${destinationPath}".`);
        } catch (error) {
            state.error = error?.message || `${mode === 'move' ? 'Move' : 'Copy'} failed from "${sourcePath}" to "${destinationPath}".`;
            render();
        }
    }

    async function loadMoveDestinationFolders(path) {
        const dialog = ui.app.querySelector('#moveCopyDialog');
        const list = ui.app.querySelector('#moveDestList');
        const currentPathText = ui.app.querySelector('#moveDestCurrentPath');

        if (!dialog || !list || !currentPathText) {
            return;
        }

        list.textContent = 'Loading folders...';

        try {
            const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path || '')}`);
            if (!response.ok) {
                const payload = await safeJson(response);
                throw new Error(payload?.message || `Could not load destination folders (HTTP ${response.status}).`);
            }

            const payload = await response.json();
            const folders = (payload.entries || []).filter(entry => entry.isDirectory);
            dialog.dataset.moveDestinationFolder = payload.currentPath || '';
            dialog.dataset.moveDestinationParent = payload.parentPath ?? '';
            currentPathText.textContent = payload.currentPath || '(root)';
            const showParentRow = payload.parentPath !== null;

            list.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${showParentRow ? `
                            <tr>
                                <td><button type="button" class="row-link" data-move-dest-parent="1">..</button></td>
                                <td>Parent Folder</td>
                            </tr>
                        ` : ''}
                        ${folders.length === 0 ? `<tr><td colspan="2" class="muted">No child folders here.</td></tr>` : folders.map(folder => `
                            <tr>
                                <td><button type="button" class="row-link" data-move-dest-open="${escapeHtml(folder.relativePath)}">${escapeHtml(folder.name)}</button></td>
                                <td>Folder</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            list.querySelectorAll('[data-move-dest-open]').forEach(button => {
                button.addEventListener('click', event => {
                    const target = event.currentTarget;
                    const nextPath = target.getAttribute('data-move-dest-open') || '';
                    loadMoveDestinationFolders(nextPath);
                });
            });

            list.querySelector('[data-move-dest-parent]')?.addEventListener('click', () => {
                loadMoveDestinationFolders(payload.parentPath || '');
            });
        } catch (error) {
            list.innerHTML = `<div class="danger">${escapeHtml(error?.message || 'Could not load destination folders.')}</div>`;
        }
    }

    function getLastPathSegment(path) {
        const parts = (path || '').split('/').filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : '';
    }

    function getParentPath(path) {
        const parts = (path || '').split('/').filter(Boolean);
        if (parts.length <= 1) {
            return '';
        }

        return parts.slice(0, -1).join('/');
    }

    function combinePath(folder, name) {
        const cleanFolder = (folder || '').replace(/^\/+|\/+$/g, '');
        const cleanName = (name || '').replace(/^\/+|\/+$/g, '');

        if (!cleanFolder) {
            return cleanName;
        }

        return cleanName ? `${cleanFolder}/${cleanName}` : cleanFolder;
    }

    function openDeleteDialog(relativePath) {
        const dialog = ui.app.querySelector('#deleteDialog');
        const text = ui.app.querySelector('#deletePathText');
        if (!dialog || !text) {
            return;
        }

        state.pendingDeletePath = relativePath;
        text.textContent = relativePath;
        dialog.showModal();
    }

    async function deletePendingPath() {
        if (!state.pendingDeletePath) {
            return;
        }

        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(state.pendingDeletePath)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const payload = await safeJson(response);
                throw new Error(payload?.message || 'Delete failed.');
            }

            const deletedPath = state.pendingDeletePath;
            ui.app.querySelector('#deleteDialog')?.close();
            state.pendingDeletePath = '';
            await loadData();
            state.error = '';
            setTemporarySuccess(`Successfully deleted "${deletedPath}".`);
        } catch (error) {
            state.error = error?.message || 'Delete failed.';
            render();
        }
    }

    async function safeJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }
})();