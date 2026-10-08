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
def occluded(P,C):
    D=(P[0]-C[0],P[1]-C[1],P[2]-C[2]);a=dot(D,D);b=2*dot(C,D);c=dot(C,C)-1
    disc=b*b-4*a*c
    if disc<0:return False
    s=(-b-math.sqrt(disc))/(2*a);return 0<s<1
def slerpdir(a3,b3,ang,tt):
    s1=math.sin((1-tt)*ang)/math.sin(ang or 1e-6); s2=math.sin(tt*ang)/math.sin(ang or 1e-6)
    return norm(tuple(a3[j]*s1+b3[j]*s2 for j in range(3)))
ents={e['id']:e for e in json.load(open('atlas/entities.json')) if e.get('lat') is not None}
thrs=json.load(open('atlas/threads.json'))
def segs(t):
    k=t.get('kind','influence')
    if k=='journey':
        nodes=[t.get('person')]+list(t.get('path',[])); return [(nodes[i],nodes[i+1]) for i in range(len(nodes)-1)]
    return [(t.get('from'),t.get('to'))]
def tipramp(tt,span):   # 1 at ends -> 0 across the outer `span` fraction each side
    return max(0,1-tt/span)+max(0,(tt-(1-span))/span)
def worst(base,tip,lift,phs,ths,ds):
    worst=0
    for ph in phs:
        for th in ths:
            for d in ds:
                C=cam(th,ph,d); vis=hidden=0
                for t in thrs:
                    L=(0.9 if t.get('kind','influence')=='signal' else 0.5)*lift
                    for (f,to) in segs(t):
                        A=ents.get(f);B=ents.get(to)
                        if not A or not B:continue
                        a3=ll2v(A['lat'],A['lng'],1); b3=ll2v(B['lat'],B['lng'],1)
                        ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
                        for i in range(N+1):
                            tt=i/N
                            r=1+base+L*ang*math.sin(math.pi*tt)+tip*tipramp(tt,0.15)
                            p=slerpdir(a3,b3,ang,tt); P=tuple(p[j]*r for j in range(3))
                            if dot(norm(p),norm(C))>0:
                                vis+=1
                                if occluded(P,C): hidden+=1
                if vis: worst=max(worst,hidden/vis)
    return worst
phs=[0.7,1.15,1.6]
ths=[i*1.047 for i in range(6)]   # 6 az
ds=[3.2]
N=24   # samples per segment
print('lift=1.0, tip-span 0.15. worst hidden/visible over 12az x 6el x 2d:')
for (base,tip) in [(0.01,0.0),(0.01,0.15),(0.02,0.2),(0.02,0.3),(0.02,0.4),(0.03,0.3),(0.04,0.2),(0.05,0.0),(0.08,0.0)]:
    print(f'  base={base:.2f} tip={tip:.2f}  worst={worst(base,tip,1.0,phs,ths,ds):.4f}')
