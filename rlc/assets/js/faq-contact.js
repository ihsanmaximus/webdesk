(()=>{
  const root=document.querySelector('.rlc-faq-contact');
  if(!root)return;
  const questions=[...root.querySelectorAll('.rfc-question')];
  questions.forEach(button=>button.addEventListener('click',()=>{
    const willOpen=button.getAttribute('aria-expanded')!=='true';
    questions.forEach(other=>{
      const answer=document.getElementById(other.getAttribute('aria-controls'));
      const isOpen=other===button&&willOpen;
      other.setAttribute('aria-expanded',String(isOpen));
      other.querySelector('.rfc-plus').textContent=isOpen?'−':'+';
      answer.hidden=!isOpen;
      other.closest('.rfc-item').classList.toggle('is-open',isOpen);
    });
  }));
  const form=root.querySelector('#rlcContactForm');
  const success=root.querySelector('#rfc-form-success');
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    success.hidden=false;
    form.querySelector('.rfc-submit').disabled=true;
    form.querySelector('.rfc-submit').textContent='Permintaan Tervalidasi';
  });
})();
