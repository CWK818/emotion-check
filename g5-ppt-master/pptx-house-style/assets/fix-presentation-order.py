#!/usr/bin/env python3
"""
fix-presentation-order.py — 修復 pptxgenjs 的 presentation.xml 子元素排序
用法：python3 fix-presentation-order.py 檔名.pptx

背景：pptxgenjs（至 4.0.1 實測仍然）在使用 addNotes 後，將
<p:notesMasterIdLst> 寫在 <p:sldIdLst> 之後，違反 ECMA-376 對
CT_Presentation 的序列規範（sldMasterIdLst → notesMasterIdLst →
handoutMasterIdLst → sldIdLst → sldSz → notesSz）。LibreOffice 容忍、
公用 validate.py（現版）不攔，但 PowerPoint 可能拒檔——
實戰紀錄：二〇二六年六月十九日理監事會議簡報拒檔事故，重排後解決。

本腳本：只搬動 notesMasterIdLst 區塊到 sldMasterIdLst 之後，
不改任何其他位元組、不碰 rels——冪等，重複執行無害。
"""
import re
import shutil
import sys
import zipfile

def fix(path: str) -> None:
    with zipfile.ZipFile(path) as z:
        xml = z.read('ppt/presentation.xml').decode('utf-8')

    order = re.findall(
        r'<p:(sldMasterIdLst|notesMasterIdLst|sldIdLst)', xml)
    if order == ['sldMasterIdLst', 'notesMasterIdLst', 'sldIdLst']:
        print('順序已正確，未做任何變更。')
        return
    if 'notesMasterIdLst' not in ''.join(order):
        print('檔內無 notesMasterIdLst（未加備忘稿），未做任何變更。')
        return

    m = re.search(r'<p:notesMasterIdLst>.*?</p:notesMasterIdLst>', xml, re.S)
    if not m:
        sys.exit('❌ 找到標籤但擷取區塊失敗，請人工檢查。')
    block = m.group(0)
    xml = xml.replace(block, '')                       # 先移除
    anchor = re.search(r'</p:sldMasterIdLst>', xml)
    if not anchor:
        sys.exit('❌ 找不到 sldMasterIdLst 錨點，請人工檢查。')
    pos = anchor.end()
    xml = xml[:pos] + block + xml[pos:]                # 插回 schema 位置

    tmp = path + '.fix'
    with zipfile.ZipFile(path) as zin, \
         zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = (xml.encode('utf-8')
                    if item.filename == 'ppt/presentation.xml'
                    else zin.read(item.filename))
            zout.writestr(item, data)
    shutil.move(tmp, path)

    with zipfile.ZipFile(path) as z:
        after = re.findall(r'<p:(sldMasterIdLst|notesMasterIdLst|sldIdLst)',
                           z.read('ppt/presentation.xml').decode('utf-8'))
    print('✅ 已修復。現行順序：', ' → '.join(after))

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('用法：python3 fix-presentation-order.py 檔名.pptx')
    fix(sys.argv[1])
