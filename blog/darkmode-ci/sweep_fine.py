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
ents={e['id']:e for e in json.load(open('atlas_data/entities.json')) if e.get('lat') is not None}
thrs=json.load(open('atlas_data/threads.json'))
SEG=[]
for t in thrs:
    L=(0.9 if t.get('kind','influence')=='signal' else 0.5)
    if t.get('kind')=='journey':
        nodes=[t.get('person')]+list(t.get('path',[])); pairs=[(nodes[i],nodes[i+1]) for i in range(len(nodes)-1)]
    else: pairs=[(t.get('from'),t.get('to'))]
    for (f,to) in pairs:
        A=ents.get(f);B=ents.get(to)
        if not A or not B:continue
        a3=ll2v(A['lat'],A['lng'],1); b3=ll2v(B['lat'],B['lng'],1)
        ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
        SEG.append((a3,b3,ang,L))
print('segments:',len(SEG))
N=32
# fine grid: 24 azimuths, 7 elevations, d in {3.2,4,6}
phis=[0.35,0.6,0.9,1.15,1.4,1.7,1.95]
ths=[i*2*math.pi/24 for i in range(24)]
ds=[3.2,4.0,6.0]
def worst(base):
    worst=0; wc=None
    for ph in phs:
        for th in ths:
            for d in ds:
                C=cam(th,ph,d); vis=hidden=0
                for (a3,b3,ang,L) in SEG:
                    for i in range(N+1):
                        tt=i/N; r=1+base+L*ang*math.sin(math.pi*tt); p=slerpdir(a3,b3,ang,tt)
                        P=tuple(p[j]*r for j in range(3))
                        if dot(norm(p),norm(C))>0:
                            vis+=1
                            if occluded(P,C): hidden+=1
                if vis and hidden/vis>worst: worst=hidden/vis; wc=(ph,th,d)
    return worst,wc
import time
for base in [0.06,0.10,0.14,0.20,0.28]:
    t0=time.time(); worst,wc=worst(base)
    print(f'base={base:.2f}  worst-hidden-frac={worst:.4f}  at ph={wc[0]:.2f},th={wc[1]:.2f},d={wc[2]:.1f}  ({time.time()-t0:.1f}s)')
