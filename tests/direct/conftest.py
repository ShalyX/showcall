"""Shared direct-mode test compatibility helpers."""

import os


if os.name == "nt":
    # GenLayer's direct loader replaces fd 0 with a temporary message file,
    # then unlinks it while Windows still has fd 0 open. Defer those unlinks
    # until pytest exits and restore the original stdin first.
    _original_unlink = os.unlink
    _deferred_unlinks = []
    _original_stdin_fd = os.dup(0)

    def _safe_unlink(path, *args, **kwargs):
        try:
            _original_unlink(path, *args, **kwargs)
        except PermissionError as exc:
            if getattr(exc, "winerror", None) != 32:
                raise
            _deferred_unlinks.append((path, args, kwargs))

    os.unlink = _safe_unlink

    def pytest_unconfigure(config):
        os.dup2(_original_stdin_fd, 0)
        os.close(_original_stdin_fd)
        for path, args, kwargs in _deferred_unlinks:
            try:
                _original_unlink(path, *args, **kwargs)
            except FileNotFoundError:
                pass
