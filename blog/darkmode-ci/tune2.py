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
def radius(tt,ang,L,base,tip):
    tiplift = tip*(max(0,1-8*tt)+max(0,8*tt-7))
    return 1+base+L*ang*math.sin(math.pi*tt)+tiplift
def metric(C,lift,base,tip):
    vis=hidden=0
    for t in thrs:
        k=t.get('kind','influence'); L=(0.9 if k=='signal' else 0.5)*lift
        if k=='journey':
            nodes=[t.get('person')]+list(t.get('path',[])); pairs=[(nodes[i],nodes[i+1]) for i in range(len(nodes)-1)]
        else: pairs=[(t.get('from'),t.get('to'))]
        for (f,to) in pairs:
            A=ents.get(f);B=ents.get(to)
            if not A or not B:continue
            a3=ll2v(A['lat'],A['lng'],1); b3=ll2v(B['lat'],B['lng'],1)
            ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
            for i in range(65):
                tt=i/64; r=radius(tt,ang,L,base,tip); p=slerpdir(a3,b3,ang,tt)
                P=tuple(p[j]*r for j in range(3))
                if dot(norm(p),norm(C))>0:
                    vis+=1
                    if occluded(P,C): hidden+=1
    return hidden/vis if vis else 0.0
# worst cameras
cams=[('east',1.57,1.3,3.2),('west',-1.57,1.3,3.2),('default',-0.4,1.15,3.2)]
Cc={n:cam(a,b,c) for n,a,b,c in cams}
print('find minimal (lift,base,tip) with 0.000 on east+west+default')
best=[]
for lift in [1.0,1.1,1.25,1.5,1.75,2.0]:
    for base in [0.01,0.04,0.08,0.12]:
        for tip in [0.0,0.1,0.2,0.3,0.4]:
            m=max(metric(Cc['east'],lift,base,tip),metric(Cc['west'],lift,base,tip),metric(Cc['default'],lift,base,tip))
            if m==0.0:
                # also report peak arc radius for long arcs (ang~2.6) to avoid ballooning
                peak = 1+base+(0.5*lift)*2.6+0
                best.append((peak,lift,base,tip,m))
best.sort()
print(f'{"peakR(long)":>12} {"lift":>5} {"base":>5} {"tip":>5}  worst')
for b in best[:15]:
    print(f'{b[0]:12.2f} {b[1]:5.2f} {b[2]:5.2f} {b[3]:5.2f}  {b[4]:.3f}')
print('\ncurrent peak for long arc (lift1,base.01,tip0):', round(1+0.01+0.5*2.6,2))
