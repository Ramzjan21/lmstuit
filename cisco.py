import os
import math
import numpy as np
import matplotlib.pyplot as plt
from diagrams import Diagram, Cluster
from diagrams.generic.network import Router, Switch
from diagrams.onprem.network import Internet
from diagrams.onprem.compute import Server
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# =============================
# LOYIHA PARAMETRLARI
# =============================

project_name = "wifi6_enterprise_project"
users = 300
office_width = 80
office_height = 50
ap_capacity = 40
ap_range = 15

os.makedirs(project_name, exist_ok=True)

# =============================
# ACCESS POINT HISOBLASH
# =============================

ap_count_users = math.ceil(users / ap_capacity)

grid_x = int(math.sqrt(ap_count_users))
grid_y = int(math.ceil(ap_count_users / grid_x))

aps = []

step_x = office_width / (grid_x + 1)
step_y = office_height / (grid_y + 1)

for i in range(grid_x):
    for j in range(grid_y):
        aps.append((step_x*(i+1), step_y*(j+1)))

# =============================
# WIFI COVERAGE HISOBLASH
# =============================

x = np.linspace(0, office_width, 200)
y = np.linspace(0, office_height, 200)
X, Y = np.meshgrid(x, y)
Z = np.zeros_like(X)

for ap in aps:
    d = np.sqrt((X-ap[0])**2 + (Y-ap[1])**2)
    Z += np.exp(-d/ap_range)

plt.figure(figsize=(8,5))
plt.contourf(X,Y,Z,20)
plt.colorbar(label="Signal")

for ap in aps:
    plt.scatter(ap[0], ap[1], c="red")

plt.title("WiFi 6 Coverage")
coverage_path = project_name+"/coverage.png"
plt.savefig(coverage_path)
plt.close()

# =============================
# ROUTER CONFIG
# =============================

router_config = """
enable
configure terminal
hostname YAT-Router

interface g0/0
 ip address 192.168.1.1 255.255.255.0
 no shutdown

ip dhcp pool STAFF
 network 192.168.20.0 255.255.255.0
 default-router 192.168.20.1
 dns-server 8.8.8.8

ip dhcp pool GUEST
 network 192.168.30.0 255.255.255.0
 default-router 192.168.30.1
 dns-server 8.8.8.8

end
write
"""

open(project_name+"/router_config.txt","w").write(router_config)

# =============================
# SWITCH CONFIG
# =============================

switch_config = """
enable
configure terminal

vlan 10
 name ADMIN

vlan 20
 name STAFF

vlan 30
 name GUEST

interface range fa0/1-24
 switchport mode trunk

end
write
"""

open(project_name+"/switch_config.txt","w").write(switch_config)

# =============================
# NETWORK DIAGRAM
# =============================

with Diagram("WiFi6 Enterprise Network", show=False, filename="network"):

    internet = Internet("Internet")
    router = Router("Router")

    with Cluster("Core"):
        core = Switch("Core Switch")

    with Cluster("Access"):
        sw1 = Switch("Access Switch 1")
        sw2 = Switch("Access Switch 2")

    server = Server("DHCP")

    internet >> router >> core
    core >> sw1
    core >> sw2
    sw1 >> server

os.replace("network.png", project_name+"/network.png")

# =============================
# PDF HISOBOT
# =============================

pdf_path = project_name+"/report.pdf"

c = canvas.Canvas(pdf_path, pagesize=A4)

c.setFont("Helvetica", 14)
c.drawString(100, 800, "WiFi 6 Enterprise Network Design")

c.setFont("Helvetica", 12)

c.drawString(100, 760, f"Total users: {users}")
c.drawString(100, 740, f"Access Points required: {len(aps)}")
c.drawString(100, 720, f"Office size: {office_width} x {office_height} meters")

c.drawString(100, 700, "Network technologies:")
c.drawString(120, 680, "- WiFi 6 (802.11ax)")
c.drawString(120, 660, "- VLAN segmentation")
c.drawString(120, 640, "- DHCP automatic addressing")

c.drawImage(coverage_path,100,350,width=400,height=250)

c.save()

print("Loyiha muvaffaqiyatli yaratildi!")
print("Papka:", project_name)
print("Router, switch config, diagram va PDF hisobot tayyor.")