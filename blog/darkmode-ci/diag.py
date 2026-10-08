#!/usr/bin/env python3
import json, math
DEG=math.pi/180; EARTH_R=1.0
def ll2v(lat,lng,r):
    phi=(lng+180)*DEG; th=(90-lat)*DEG; st=math.sin(th)
    return (-r*st*math.cos(phi), r*math.cos(th), r*st*math.sin(phi))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
def norm(a):
    l=math.sqrt(dot(a,a)); return(1,0,0) if l<1e-9 else (a[0]/l,a[1]/l,a[2]/l)
def cam():
    theta,phi,d=-0.4,1.15,3.2; sp=math.sin(phi)
    return (d*sp*math.cos(theta),d*math.cos(phi),d*sp*math.sin(theta))
def occ(P,C):
    D=(P[0]-C[0],P[1]-C[1],P[2]-C[2]);a=dot(D,D);b=2*dot(C,D);c=dot(C,C)-1
    disc=b*b-4*a*c
    if disc<0:return False
    s=(-b-math.sqrt(disc))/(2*a);return 0<s<1
def slerpdir(a3,b3,ang,tt):
    s1=math.sin((1-tt)*ang)/math.sin(ang or 1e-6); s2=math.sin(tt*ang)/math.sin(ang or 1e-6)
    return norm(tuple(a3[j]*s1+b3[j]*s2 for j in range(3)))
C=cam()
ents={e['id']:e for e in json.load(open('atlas/entities.json')) if e.get('lat') is not None}
thrs=json.load(open('atlas/threads.json'))
def front(v): return dot(norm(v),norm(C))>0
best=None
for t in thrs:
    k=t.get('kind','influence'); L=0.9 if k=='signal' else 0.5
    if k=='journey':
        nodes=[t.get('person')]+list(t.get('path',[])); pairs=[(nodes[i],nodes[i+1]) for i in range(len(nodes)-1)]
    else: pairs=[(t.get('from'),t.get('to'))]
    o=tot=0
    for (f,to) in pairs:
        A=ents.get(f);B=ents.get(to)
        if not A or not B:continue
        a3=ll2v(A['lat'],A['lng'],1); b3=ll2v(B['lat'],B['lng'],1)
        ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
        for i in range(33):
            tt=i/32; p=slerpdir(a3,b3,ang,tt)
            r=1+0.01+L*ang*math.sin(math.pi*tt); P=tuple(p[j]*r for j in range(3)); tot+=1
            if occ(P,C):o+=1
    if tot and (best is None or o/tot>best[0]): best=(o/tot,o,tot,t)
frac,o,tot,t=best
print('most-occluded thread:', json.dumps(t)[:120])
f=ents.get(t.get('from')); to=ents.get(t.get('to'))
if f: print('  from',f['name'],f['lat'],f['lng'],'front' if front(ll2v(f['lat'],f['lng'],1)) else 'BACK')
if to:print('  to  ',to['name'],to['lat'],to['lng'],'front' if front(ll2v(to['lat'],to['lng'],1)) else 'BACK')
print(f'  occluded {o}/{tot} = {frac:.3f}')
if f and to:
    a3=ll2v(f['lat'],f['lng'],1); b3=ll2v(to['lat'],to['lng'],1)
    ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
    print('  t     r      front  occ')
    for i in range(0,33,3):
        tt=i/32; p=slerpdir(a3,b3,ang,tt); r=1+0.01+0.5*ang*math.sin(math.pi*tt)
        P=tuple(p[j]*r for j in range(3))
        print(f'  {tt:.2f}  {r:.3f}   {"F" if front(P) else "B"}     {"X" if occ(P,C) else ""}')
