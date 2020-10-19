const getButtonLine = () => {
    const container = document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]')?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
    const buttonLine = (container?.children?.[0]?.id === 'jira-issue-header') ? container?.children?.[3] : container?.children?.[2];

    if (!buttonLine) {
        return { buttonLine: null };
    }

    return {
        buttonLine,
        taskTitle: document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]').innerText,
        taskNumber: document.querySelector('[data-test-id="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"]').children[1].firstChild.firstChild.firstChild.innerText,
    };
}

const injectButton = () => {
    const { buttonLine, taskTitle, taskNumber } = getButtonLine();
    if (!buttonLine) {
        return null;
    }

    const div = document.createElement('div');
    div.classList.add('copy-ttt-task-name');
    div.innerHTML = `TTT`;
    div.title = 'Копировать название задачи в TTT';

    div.addEventListener('click', () => {
        const input = document.createElement('input');
        input.style.width = '10px';
        div.after(input);
        input.focus();
        input.value = `Wynd-POS-Product / Development / ${taskNumber} - ${taskTitle.replaceAll('/', '-')}`;
        input.select();
        document.execCommand('copy');
        input.remove();
        div.focus();
    });

    buttonLine.append(div);
}

chrome.extension.sendMessage({}, response => {
    const readyStateCheckInterval = setInterval(() => {
        if (document.readyState === 'complete') {
            if (!document.querySelector('.copy-ttt-task-name')) {
                injectButton();
            }
        }
    }, 500);
});