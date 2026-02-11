// infix.js - Standalone Infix → Postfix/Prefix Visualizer
// Clean, single-class implementation providing an input box, conversion controls,
// step-by-step visualization, and basic styling hooks.

class InfixVisualizer {
    static init(visualizationArea, operationsDiv, timeComplexityP, spaceComplexityP, animationSpeed) {
        this.visualizationArea = visualizationArea;
        this.operationsDiv = operationsDiv;
        this.timeComplexityP = timeComplexityP;
        this.spaceComplexityP = spaceComplexityP;
        this.animationSpeed = animationSpeed || 500;

        this.steps = [];
        this.currentIndex = 0;
        this.timer = null;
        this.isPlaying = false;

        this.exampleExpressions = [
            'A+B*C-(D/E+F)^G',
            'A*(B+C)/D',
            '(A+B)*(C-D)',
            'a+b*c',
            '((A+B)*C)-D^E^F'
        ];

        // Clear any old visualization first, then build the UI so the top-bar input isn't removed.
        this.clearVisualization();
        this.setupUI();
        this.updateComplexity();
    }

    static isOperator(c) { return ['+','-','*','/','^'].includes(c); }
    static precedence(c) { if (c === '^') return 3; if (c === '*'||c === '/') return 2; if (c==='+'||c==='-') return 1; return 0; }

    static setupUI() {
        // Clear operations panel
        if (this.operationsDiv) this.operationsDiv.innerHTML = '';

        // Container in operations panel
        const container = document.createElement('div'); container.className = 'infix-panel';

        // Create the main input (we'll also place it in the visualization topbar)
        const input = document.createElement('input'); input.id = 'infix-input'; input.placeholder = 'Enter infix expression (e.g., A+B*C)'; input.type='text'; input.style.flex='1'; input.style.padding='8px'; input.style.borderRadius='4px'; input.style.border='1px solid #ccc';

        // Examples dropdown (kept in operations panel)
        const examples = document.createElement('select'); examples.id = 'infix-examples'; const defaultOpt = document.createElement('option'); defaultOpt.value=''; defaultOpt.textContent='Examples'; examples.appendChild(defaultOpt);
        this.exampleExpressions.forEach(e=>{ const o=document.createElement('option'); o.value=e; o.textContent=e; examples.appendChild(o); });
        examples.style.padding='6px'; examples.style.borderRadius='4px';

        // Top bar inside visualization so input stays visible
        const topBar = document.createElement('div'); topBar.className='infix-topbar'; topBar.style.display='flex'; topBar.style.gap='8px'; topBar.style.alignItems='center'; topBar.style.padding='8px';
        topBar.appendChild(input);

        // Append topBar to visualization area (fallback: operationsDiv)
        if (this.visualizationArea) {
            // remove existing
            const existing = this.visualizationArea.querySelector('.infix-topbar'); if (existing) existing.remove();
            this.visualizationArea.prepend(topBar);
        } else if (this.operationsDiv) {
            // show at top of operations if visualization not available
            this.operationsDiv.prepend(topBar);
        }

        // Buttons row in operations panel
        const buttons = document.createElement('div'); buttons.style.marginTop='8px'; buttons.style.display='flex'; buttons.style.gap='8px'; buttons.style.flexWrap='wrap';
        const toPost = document.createElement('button'); toPost.id='infix-postfix'; toPost.textContent='Convert to Postfix';
        const toPre = document.createElement('button'); toPre.id='infix-prefix'; toPre.textContent='Convert to Prefix';
        const next = document.createElement('button'); next.id='infix-next'; next.textContent='Next Step';
        const play = document.createElement('button'); play.id='infix-play'; play.textContent='Auto Play';
        const reset = document.createElement('button'); reset.id='infix-reset'; reset.textContent='Reset';
        buttons.appendChild(toPost); buttons.appendChild(toPre); buttons.appendChild(next); buttons.appendChild(play); buttons.appendChild(reset);

        // Result and controls
        const bottomRow = document.createElement('div'); bottomRow.style.marginTop='8px'; bottomRow.style.display='flex'; bottomRow.style.alignItems='center'; bottomRow.style.gap='12px';
        const speedLabel = document.createElement('label'); speedLabel.textContent='Speed:';
        const speed = document.createElement('input'); speed.type='range'; speed.id='infix-speed'; speed.min='100'; speed.max='1500'; speed.value=this.animationSpeed; speed.style.width='140px';
        const resultP = document.createElement('p'); resultP.id='infix-result'; resultP.style.margin='0';
        const darkLabel = document.createElement('label'); darkLabel.style.display='flex'; darkLabel.style.alignItems='center'; darkLabel.style.gap='6px'; const darkCheckbox = document.createElement('input'); darkCheckbox.type='checkbox'; darkCheckbox.id='infix-darkmode'; const darkText = document.createElement('span'); darkText.textContent='Dark Mode'; darkLabel.appendChild(darkCheckbox); darkLabel.appendChild(darkText);

        bottomRow.appendChild(speedLabel); bottomRow.appendChild(speed); bottomRow.appendChild(resultP); bottomRow.appendChild(darkLabel);

        // Compose operations panel
        const opRow = document.createElement('div'); opRow.style.display='flex'; opRow.style.gap='8px'; opRow.style.marginTop='8px'; opRow.appendChild(examples);
        container.appendChild(opRow);
        container.appendChild(buttons);
        container.appendChild(bottomRow);

        if (this.operationsDiv) this.operationsDiv.appendChild(container);

        // Event listeners
        toPost.addEventListener('click', ()=>this.startConversion('postfix'));
        toPre.addEventListener('click', ()=>this.startConversion('prefix'));
        next.addEventListener('click', ()=>this.nextStep());
        play.addEventListener('click', ()=>this.togglePlay());
        reset.addEventListener('click', ()=>this.reset());
        speed.addEventListener('input', (e)=>{ this.animationSpeed = parseInt(e.target.value); });
        examples.addEventListener('change', (e)=>{ if (e.target.value) input.value = e.target.value; });
        darkCheckbox.addEventListener('change', (e)=>{ document.documentElement.classList.toggle('dark-theme', e.target.checked); });
    }

    static clearVisualization() {
        if (this.visualizationArea) this.visualizationArea.innerHTML = '';
        const placeholder = document.createElement('div'); placeholder.className='linked-list-container'; placeholder.innerHTML = '<em>Enter an expression and click Convert to see step-by-step visualization.</em>';
        if (this.visualizationArea) this.visualizationArea.appendChild(placeholder);
    }

    static validateExpression(expr) {
        if (!expr || expr.trim().length === 0) return { ok:false, error:'Empty input' };
        if (!/^[\-+*/^()\s0-9A-Za-z]+$/.test(expr)) return { ok:false, error:'Invalid characters present' };
        let bal=0; for (let ch of expr){ if (ch==='(') bal++; if (ch===')') bal--; if (bal<0) return {ok:false,error:'Mismatched parentheses'} }
        if (bal!==0) return {ok:false,error:'Mismatched parentheses'}; return {ok:true};
    }

    static startConversion(mode){
        const input = document.getElementById('infix-input'); if (!input) { alert('Input not found'); return; }
        const infix = input.value.trim(); const val = this.validateExpression(infix); if (!val.ok){ alert('Invalid expression: '+val.error); return; }
        const res = (mode==='postfix')? this.infixToPostfixSteps(infix) : this.infixToPrefixSteps(infix);
        this.steps = res.steps; this.result = res.output; if (document.getElementById('infix-result')) document.getElementById('infix-result').textContent = `${mode.toUpperCase()}: ${this.result}`;
        this.currentIndex = 0; this.isPlaying=false; if (this.timer){ clearInterval(this.timer); this.timer=null; }
        this.renderStep(); this.renderStepTable();
    }

    static infixToPostfixSteps(infix){
        const steps=[]; const stack=[]; let output=''; const isOp=this.isOperator.bind(this); const prec=this.precedence.bind(this);
        for (let i=0;i<infix.length;i++){ const ch=infix[i]; if (ch===' ') continue; if (!isOp(ch) && ch!=='(' && ch!==')'){ output+=ch; steps.push({symbol:ch,action:'append',stack:[...stack],output,explanation:`Operand '${ch}' appended.`,type:'operand'}); }
            else if (ch==='('){ stack.push(ch); steps.push({symbol:ch,action:'push',stack:[...stack],output,explanation:'Push (',type:'paren'}); }
            else if (ch===')'){ while(stack.length && stack[stack.length-1]!=='('){ const p=stack.pop(); output+=p; steps.push({symbol:')',action:'pop',stack:[...stack],output,explanation:`Pop '${p}' to output`,type:'paren'}); } if (stack.length && stack[stack.length-1]==='(') stack.pop(); steps.push({symbol:')',action:'discard',stack:[...stack],output,explanation:'Discard (',type:'paren'}); }
            else if (isOp(ch)){ while(stack.length && stack[stack.length-1]!=='(' && ((prec(stack[stack.length-1])>prec(ch)) || (prec(stack[stack.length-1])===prec(ch) && ch!=='^'))){ const top=stack[stack.length-1]; steps.push({symbol:ch,action:'compare',stack:[...stack],output,explanation:`Compare ${ch} with ${top}`,compare:{top,ch},type:'operator'}); const p=stack.pop(); output+=p; steps.push({symbol:ch,action:'pop',stack:[...stack],output,explanation:`Pop ${p}`,type:'operator'}); } stack.push(ch); steps.push({symbol:ch,action:'push',stack:[...stack],output,explanation:`Push ${ch}`,type:'operator'}); } }
        while(stack.length){ const p=stack.pop(); output+=p; steps.push({symbol:p,action:'pop',stack:[...stack],output,explanation:`End pop ${p}`,type:this.isOperator(p)?'operator':'paren'}); }
        return {steps,output};
    }

    static infixToPrefixSteps(infix){ const rev=infix.split('').reverse().map(c=> c==='('?')': c===')'?'(': c).join(''); const {steps:revSteps,output:revOut}=this.infixToPostfixSteps(rev); const prefix=revOut.split('').reverse().join(''); const steps=revSteps.map(s=>({...s,explanation:s.explanation+' (reversed)'})); return {steps,output:prefix}; }

    static renderStep(){
        const area=this.visualizationArea; if(!area) return; area.querySelectorAll('.infix-step-content')?.forEach(n=>n.remove());
        const wrapper=document.createElement('div'); wrapper.className='infix-step-content'; wrapper.style.padding='12px';
        if(!this.steps || this.steps.length===0){ wrapper.innerHTML='<em>No steps to display</em>'; area.appendChild(wrapper); return; }
        const s=this.steps[this.currentIndex];
        wrapper.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Step ${this.currentIndex+1} / ${this.steps.length}</div>`;
        const cur=document.createElement('div'); cur.innerHTML=`<strong>Symbol:</strong> <span class='${s.type==='operand'?'operand':s.type==='operator'?'operator':'paren'}'>${s.symbol}</span>`; wrapper.appendChild(cur);
        const stackVis=document.createElement('div'); stackVis.style.marginTop='8px'; stackVis.innerHTML='<div style="font-weight:700">Stack</div>';
        const stackBox=document.createElement('div'); stackBox.className='stack-visual'; (s.stack||[]).slice().reverse().forEach(it=>{ const el=document.createElement('div'); el.className='stack-box'; el.textContent=it; if(this.isOperator(it)) el.classList.add('operator'); else if(it==='('||it===')') el.classList.add('paren'); else el.classList.add('operand'); stackBox.appendChild(el); }); stackVis.appendChild(stackBox); wrapper.appendChild(stackVis);
        const out=document.createElement('div'); out.style.marginTop='8px'; out.innerHTML=`<div style="font-weight:700">Output</div><div class='output-box' style='margin-top:6px;padding:6px;'>${s.output||''}</div>`; wrapper.appendChild(out);
        const expl=document.createElement('div'); expl.style.marginTop='8px'; expl.innerHTML=`<div style="font-weight:700">Explanation</div><div class='explanation' style='margin-top:4px'>${s.explanation}</div>`; wrapper.appendChild(expl);
        area.appendChild(wrapper);
    }

    static renderStepTable() { /* kept for symmetry; table shown inside renderStep if needed */ }

    static nextStep(){ if(!this.steps||!this.steps.length) return; this.currentIndex=Math.min(this.currentIndex+1,this.steps.length-1); this.renderStep(); }
    static prevStep(){ if(!this.steps||!this.steps.length) return; this.currentIndex=Math.max(this.currentIndex-1,0); this.renderStep(); }
    static togglePlay(){ const btn=document.getElementById('infix-play'); if(this.isPlaying){ this.isPlaying=false; if(this.timer){ clearInterval(this.timer); this.timer=null; } if(btn) btn.textContent='Auto Play'; } else { if(!this.steps||!this.steps.length) return; this.isPlaying=true; if(btn) btn.textContent='Pause'; this.timer=setInterval(()=>{ if(this.currentIndex>=this.steps.length-1){ clearInterval(this.timer); this.isPlaying=false; if(btn) btn.textContent='Auto Play'; return; } this.currentIndex++; this.renderStep(); }, this.animationSpeed||500); } }
    static reset(){ if(this.timer){ clearInterval(this.timer); this.timer=null; } this.steps=[]; this.currentIndex=0; this.isPlaying=false; const res=document.getElementById('infix-result'); if(res) res.textContent=''; this.clearVisualization(); }

    static updateComplexity(){ if(this.timeComplexityP) this.timeComplexityP.textContent='Time Complexity: O(n)'; if(this.spaceComplexityP) this.spaceComplexityP.textContent='Space Complexity: O(n)'; }
}

