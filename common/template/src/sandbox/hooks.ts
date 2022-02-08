import React, { useCallback, useEffect, useState } from 'react';

export const SANDBOX_DEPLOYED = Boolean(process.env.REACT_APP_SANDBOX_DEPLOYED);

export function useLoadSnapshot() {
  return useCallback(() => {
    if (SANDBOX_DEPLOYED) {
      const snapshot = require('../snapshot.json');
      window.dispatchEvent(new CustomEvent('load-snapshot', { detail: snapshot }));
    }
  }, []);
}

/**
 * captures canvas state when deploying sandbox
 */
export function useSandboxSnapshot(canvasRef: React.RefObject<fabric.Canvas>) {
  useEffect(() => {
    const restore = (e) => {
      const data = e.detail.shift();
      canvasRef.current.loadFromJSON(data);
    }
    const deploy = (e) => {
      (e as CustomEvent).detail.push(canvasRef.current.toJSON());
    }
    window.addEventListener('load-snapshot', restore);
    window.addEventListener('deploy', deploy);
    return () => {
      window.removeEventListener('load-snapshot', restore);
      window.removeEventListener('deploy', deploy);
    }
  }, [canvasRef]);
}

export function useDeployCodeSandbox() {
  const [pending, setPending] = useState(false);
  const deployCodeSandbox = useCallback(async () => {
    setPending(true);
    const snapshot = [];
    window.dispatchEvent(new CustomEvent('deploy', { detail: snapshot }));
    try {
      const { uri } = await (await fetch('/codesandbox', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(snapshot)
      })).json();
      window.open(uri, '_blank');
    } catch (error) {
      console.error(error);
    }
    setPending(false);
  }, []);
  return [pending, deployCodeSandbox] as [boolean, () => void];
}

export interface GitInfo {
  user: string,
  branch: string,
  tag: string,
  changes: {
    type: string,
    path: string
  }[]
}

export function useGitInfo() {
  const [info, setInfo] = useState<GitInfo | null>(null);
  const update = useCallback(() => {
    fetch('/git')
      .then(res => res.json())
      .then(setInfo)
      .catch(() => {
        try {
          setInfo(require('../git.json'));
        } catch (error) { }
      });
  }, []);
  useEffect(() => {
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [update]);
  return info;
}

export function openIDE() {
  return fetch('/open-ide');
}

const STORAGE_KEY_MODAL = 'fabric:react-sandbox:modal';
const STORAGE_KEY_COMMENTS = 'fabric:react-sandbox:comments';

export function useShowModal() {
  const [show, setShow] = useState(() => {
    return SANDBOX_DEPLOYED || localStorage.getItem(STORAGE_KEY_MODAL) ? 0 : -1;
  });
  useEffect(() => {
    show === -1 && setShow(1);
  }, [show]);
  useEffect(() => {
    show > -1 && localStorage.setItem(STORAGE_KEY_MODAL, 'true');
  }, [show]);
  return [show, setShow] as [number, React.Dispatch<number>];
}

export function useShowComments() {
  const [show, setShow] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_COMMENTS) ? 0 : SANDBOX_DEPLOYED ? 1 : -1;
  });
  useEffect(() => {
    show > -1 && localStorage.setItem(STORAGE_KEY_COMMENTS, 'true');
  }, [show]);
  return [show, setShow] as [number, React.Dispatch<number>];
}