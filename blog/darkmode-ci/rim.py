#!/usr/bin/env python3
import json, math
DEG=math.pi/180
def ll2v(lat,lng,r):
    phi=(lng+180)*DEG; th=(90-lat)*DEG; st=math.sin(th)
    return (-r*st*math.cos(phi), r*math.cos(th), r*st*math.sin(phi))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
def norm(a):
    l=math.sqrt(dot(a,a)); return(1,0,0) if l<1e-9 else (a[0]/l,a[1]/l,a[2]/l)
def cam(th,ph,d):
    sp=math.sin(ph); return (d*sp*math.cos(th),d*math.cos(ph),d*sp*math.sin(th))
def occ(P,C):
    D=(P[0]-C[0],P[1]-C[1],P[2]-C[2]);a=dot(D,D);b=2*dot(C,D);c=dot(C,C)-1
    disc=b*b-4*a*c
    if disc<0:return False
    s=(-b-math.sqrt(disc))/(2*a);return 0<s<1
def slerpdir(a3,b3,ang,tt):
    s1=math.sin((1-tt)*ang)/math.sin(ang or 1e-6); s2=math.sin(tt*ang)/math.sin(ang or 1e-6)
    return norm(tuple(a3[j]*s1+b3[j]*s2 for j in range(3)))
ents={e['id']:e for e in json.load(open('atlas/entities.json')) if e.get('lat') is not None}
thrs=json.load(open('atlas/threads.json'))
def front(v):return dot(norm(v),norm((0,0,0)+ (0,0,0) or (1,0,0)))>0  # placeholder
def rim_term_vanish(C,base):
    """Count thread-endpoints that are (a) on the front hemisphere (visible dot)
    but (b) whose line, for the first ~12% of its arc, is fully hidden. This is
    the 'line ends at the rim' symptom."""
    bad=0; checked=0
    for t in thrs:
        k=t.get('kind','influence'); L=0.9 if k=='signal' else 0.5
        if k=='journey':
            nodes=[t.get('person')]+list(t.get('path',[])); pairs=[(nodes[i],nodes[i+1]) for i in range(len(nodes)-1)]
        else: pairs=[(t.get('from'),t.get('to'))]
        for (f,to) in pairs:
            A=ents.get(f);B=ents.get(to)
            if not A or not B:continue
            a3=ll2v(A['lat'],A['lng'],1); b3=ll2v(B['lat'],B['lng'],1)
            ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
            for (end,lo,hi) in (('A',0,12),('B',20,32)):
                ep = a3 if end=='A' else b3
                if dot(norm(ep),norm(C))<0.2: continue   # endpoint not clearly visible
                checked+=1
                hidden_all=True
                for i in range(lo,hi+1):
                    tt=i/32; p=slerpdir(a3,b3,ang,tt)
                    r=1+base+L*ang*math.sin(math.pi*tt); P=tuple(p[j]*r for j in range(3))
                    if not occ(P,C): hidden_all=False; break
                if hidden_all: bad+=1
    return bad,checked
cams=[('default',-0.4,1.15,3.2),('front',0.0,1.2,3.2),('east',1.57,1.3,3.2),('west',-1.57,1.3,3.2),('top',0.3,0.6,3.2),('low',0.5,1.8,3.2)]
print('rim-termination (visible endpoint, whole near-end hidden):')
for name,th,ph,d in cams:
    C=cam(th,ph,d)
    row=[]
    for base in [0.01,0.05,0.08,0.12,0.20]:
        bad,checked=rim_term_vanish(C,base)
        row.append(f'b{base:.2f}:{bad}/{checked}')
    print(f'  {name:8s}  '+'  '.join(row))
